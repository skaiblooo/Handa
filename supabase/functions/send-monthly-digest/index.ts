import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Meant to run on a monthly cron, separate from send-reminders' daily one —
// this sends whether or not anything's actually due, so the app has a
// touchpoint between renewals instead of only ever emailing when something's
// urgent. Roadmap reasoning: a low-frequency app risks disappearing from
// someone's mind entirely between the few times a year they'd otherwise
// think about it.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const LOOKAHEAD_MONTHS = 6

Deno.serve(async (req) => {
  // Same cron-only gate as send-reminders: this fans out across every
  // user's documents, which is only safe to expose to the cron trigger
  // itself, not to anyone holding the public anon key. Reuses that
  // function's CRON_SECRET rather than a separate one, since both are
  // equally "the daily/monthly job, not a real user."
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('X-Cron-Secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

  // Application-intent documents have a placeholder expiry_date, not a real
  // one — same exclusion send-reminders and the dashboard's expiration
  // chart already make, so an in-progress application never shows up as a
  // false "due soon" here either.
  const { data: documents, error } = await supabaseAdmin
    .from('documents')
    .select('id, title, expiry_date, user_id')
    .eq('intent', 'renewal')

  if (error) {
    console.error('send-monthly-digest: failed to fetch documents', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }

  const now = new Date()
  const lookaheadEnd = new Date(now.getFullYear(), now.getMonth() + LOOKAHEAD_MONTHS, now.getDate())

  const byUser: Record<string, { total: number; dueSoon: { title: string; expiry_date: string }[] }> = {}
  for (const doc of documents) {
    if (!byUser[doc.user_id]) byUser[doc.user_id] = { total: 0, dueSoon: [] }
    byUser[doc.user_id].total++
    if (new Date(doc.expiry_date) <= lookaheadEnd) {
      byUser[doc.user_id].dueSoon.push({ title: doc.title, expiry_date: doc.expiry_date })
    }
  }

  let emailsSent = 0

  for (const userId of Object.keys(byUser)) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (!email) continue // guests have nowhere for this to go; nothing to send

    const { total, dueSoon } = byUser[userId]
    const docWord = total === 1 ? 'document' : 'documents'

    const bodyHtml =
      dueSoon.length > 0
        ? `<p>You're tracking ${total} ${docWord} on Orbit. ${dueSoon.length} ${dueSoon.length === 1 ? 'is' : 'are'} due in the next ${LOOKAHEAD_MONTHS} months:</p>` +
          `<ul>${dueSoon.map((d) => `<li>${escapeHtml(d.title)}, expires ${escapeHtml(d.expiry_date)}</li>`).join('')}</ul>`
        : `<p>You're tracking ${total} ${docWord} on Orbit, and nothing's due in the next ${LOOKAHEAD_MONTHS} months. You're all set.</p>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Orbit <onboarding@resend.dev>',
        to: email,
        subject: 'Your Orbit status this month',
        html: `<p>Hi,</p>${bodyHtml}`,
      }),
    })

    emailsSent++
  }

  return new Response(JSON.stringify({ emailsSent }), { status: 200 })
})
