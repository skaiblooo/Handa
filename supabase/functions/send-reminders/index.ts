import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

  // Get all documents expiring within the next 30 days
  const today = new Date()
  const thirtyDaysOut = new Date()
  thirtyDaysOut.setDate(today.getDate() + 30)

  const { data: documents, error } = await supabaseAdmin
    .from('documents')
    .select('id, title, doc_type, expiry_date, user_id')
    .lte('expiry_date', thirtyDaysOut.toISOString())
    .gte('expiry_date', today.toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Group documents by user so each person gets ONE email, not one per document
  const byUser: Record<string, typeof documents> = {}
  for (const doc of documents) {
    if (!byUser[doc.user_id]) byUser[doc.user_id] = []
    byUser[doc.user_id].push(doc)
  }

  let emailsSent = 0

  for (const userId of Object.keys(byUser)) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = userData?.user?.email
    if (!email) continue

    const docsList = byUser[userId]
      .map((d) => `<li>${d.title} — expires ${d.expiry_date}</li>`)
      .join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Handa <onboarding@resend.dev>',
        to: email,
        subject: 'You have documents expiring soon',
        html: `<p>Hi, here's what's coming up:</p><ul>${docsList}</ul>`,
      }),
    })

    emailsSent++
  }

  return new Response(JSON.stringify({ emailsSent }), { status: 200 })
})