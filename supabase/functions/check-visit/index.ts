import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Browser calls to an edge function are cross-origin by default (the app
// runs on a different host than *.supabase.co), so without these headers
// the browser blocks the response before App.jsx ever sees it.
//
// Access-Control-Allow-Origin locks to known app origins when
// ALLOWED_APP_ORIGINS is set (the same env var send-password-reset already
// uses for redirect validation) and falls back to '*' when it's unset, so
// setting the var can only ever narrow access — it never breaks the app if
// it hasn't been configured yet.
const allowedOrigins = (Deno.env.get('ALLOWED_APP_ORIGINS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  return {
    'Access-Control-Allow-Origin':
      allowedOrigins.length === 0 ? '*' : allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  }
}

// Lets the landing page decide whether to lead with signup (never seen
// this IP before) or a login screen with the email remembered (seen it
// before), without making the visitor commit to either up front. The IP
// itself is never stored, only a SHA-256 hash of it, and this table has no
// RLS policies, so only this function (via the service role key) can ever
// read or write it.
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const forwardedFor = req.headers.get('x-forwarded-for') || ''
  const ip = forwardedFor.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

  try {
    const ipHash = await hashIp(ip)

    const { data: existing } = await supabaseAdmin
      .from('site_visits')
      .select('ip_hash')
      .eq('ip_hash', ipHash)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin.from('site_visits').update({ last_seen: new Date().toISOString() }).eq('ip_hash', ipHash)
      return new Response(JSON.stringify({ returning: true }), { status: 200, headers: corsHeaders })
    }

    await supabaseAdmin.from('site_visits').insert({ ip_hash: ipHash })
    return new Response(JSON.stringify({ returning: false }), { status: 200, headers: corsHeaders })
  } catch (err) {
    // A tracking failure shouldn't block anyone from using the site, default
    // to the "first visit" experience (signup) rather than erroring out.
    console.error('check-visit: unexpected error', err)
    return new Response(JSON.stringify({ returning: false }), { status: 200, headers: corsHeaders })
  }
})
