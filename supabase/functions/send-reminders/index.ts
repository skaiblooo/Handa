import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const THRESHOLDS = [30, 7, 1]

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
  function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

const today = toDateOnly(new Date())

  // Application-intent documents don't exist yet, so their expiry_date is
  // only an internal placeholder — never real. Excluding them here is what
  // keeps that placeholder from ever turning into a misleading email.
  const { data: documents, error } = await supabaseAdmin
    .from('documents')
    .select('id, title, doc_type, expiry_date, user_id')
    .eq('intent', 'renewal')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const toSend: Record<string, { title: string; expiry_date: string; threshold: number }[]> = {}

  for (const doc of documents) {
    const expiry = toDateOnly(new Date(doc.expiry_date))
const daysUntil = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const matchedThreshold = THRESHOLDS.find((t) => daysUntil === t)
    if (!matchedThreshold) continue

    // Check if we've already sent this exact threshold for this document
    const { data: existing } = await supabaseAdmin
      .from('reminder_log')
      .select('id')
      .eq('document_id', doc.id)
      .eq('threshold_days', matchedThreshold)
      .maybeSingle()

    if (existing) continue // already sent, skip

    if (!toSend[doc.user_id]) toSend[doc.user_id] = []
    toSend[doc.user_id].push({
      title: doc.title,
      expiry_date: doc.expiry_date,
      threshold: matchedThreshold,
    })

    // Log it immediately so we don't double-send if this function runs twice
    await supabaseAdmin.from('reminder_log').insert({
      document_id: doc.id,
      threshold_days: matchedThreshold,
    })
  }

  let emailsSent = 0

  for (const userId of Object.keys(toSend)) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (!email) continue

    const docsList = toSend[userId]
      .map((d) => `<li>${d.title}, expires ${d.expiry_date} (${d.threshold} days left)</li>`)
      .join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Orbit <onboarding@resend.dev>',
        to: email,
        subject: 'You have documents expiring soon',
        html: `<p>Hi, here's what's coming up:</p><ul>${docsList}</ul>`,
      }),
    })

    emailsSent++
  }

  return new Response(JSON.stringify({ emailsSent }), { status: 200 })
})