import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Browser calls to an edge function are cross-origin by default (the app
// runs on a different host than *.supabase.co), so without these headers
// the browser blocks the response before App.jsx ever sees it.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
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
    return new Response(JSON.stringify({ returning: false, error: err instanceof Error ? err.message : 'Unknown error' }), { status: 200, headers: corsHeaders })
  }
})
