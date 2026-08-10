import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Browser calls to an edge function are cross-origin by default (the app
// runs on a different host than *.supabase.co), so without these headers
// the browser blocks the response before Auth.jsx ever sees it.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

// Only ever redirect back into the app itself — without this, someone could
// POST straight to this function (bypassing Auth.jsx entirely) with an
// arbitrary redirectTo and turn a legitimate password-reset email into a
// phishing link. Set as an edge function secret (comma-separated origins);
// with nothing set, every custom redirect is rejected and Supabase falls
// back to its own dashboard-configured default — safe, just not branded.
const allowedOrigins = (Deno.env.get('ALLOWED_APP_ORIGINS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function safeRedirect(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  try {
    return allowedOrigins.includes(new URL(url).origin) ? url : undefined
  } catch {
    return undefined
  }
}

const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MINUTES = 60

// Orbit sends this email itself (via Resend, the same service send-reminders
// already uses) instead of Supabase's own default reset email, so the
// message is branded and the link actually works: generateLink here gives
// us the real recovery URL to embed, rather than letting Supabase's stock
// template send a generic one.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

  try {
    const { email, redirectTo } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400, headers: corsHeaders })
    }

    // Caps how many reset emails a single address can be sent per window —
    // without this, this endpoint (unlike Supabase's own rate-limited
    // recovery flow, which this bypasses by design) could be hammered to
    // spam-bomb an arbitrary inbox or burn through the Resend quota.
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('password_reset_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .gte('requested_at', windowStart)

    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      console.warn('send-password-reset: rate limit hit for', email)
      // Same success response as a normal send — doesn't confirm or deny
      // anything about the account, just quietly skips sending.
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
    }

    await supabaseAdmin.from('password_reset_attempts').insert({ email: email.toLowerCase() })

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: safeRedirect(redirectTo) },
    })

    // Same response whether the account exists or not, so this endpoint
    // can't be used to check which emails have an Orbit account.
    if (!error && data?.properties?.action_link) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Orbit <onboarding@resend.dev>',
          to: email,
          subject: 'Reset your Orbit password',
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #0f172a; margin-bottom: 4px;">Reset your password</h2>
              <p style="color: #475569; line-height: 1.5;">We got a request to reset the password for your Orbit account. Click the button below to choose a new one.</p>
              <p style="text-align: center; margin: 32px 0;">
                <a href="${data.properties.action_link}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
              </p>
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">If you didn't request this, you can safely ignore this email, your password won't change. This link expires in 1 hour.</p>
            </div>
          `,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('send-password-reset: unexpected error', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
  }
})
