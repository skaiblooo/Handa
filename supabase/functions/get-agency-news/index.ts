import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Browser calls to an edge function are cross-origin by default (the app
// runs on a different host than *.supabase.co), so without these headers
// the browser blocks the response before Dashboard.jsx ever sees it.
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

const QUERY_KEY = 'ph_agency_documents'
// Just under the client's 30-minute poll interval, so a request that lands
// right before the client's next poll still gets a fresh fetch instead of
// serving an article set that's about to be a full cycle stale.
const CACHE_MINUTES = 28
const GNEWS_QUERY = 'LTO OR PSA OR PhilHealth OR SSS OR DFA OR BIR OR NBI OR PhilSys OR "driver\'s license" OR passport OR "birth certificate"'

type Article = {
  title: string
  url: string
  source: string
  publishedAt: string
  image: string | null
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

  const { data: cached } = await supabaseAdmin
    .from('news_cache')
    .select('articles, fetched_at')
    .eq('query_key', QUERY_KEY)
    .maybeSingle()

  const cacheAgeMinutes = cached ? (Date.now() - new Date(cached.fetched_at).getTime()) / 60000 : Infinity
  if (cached && cacheAgeMinutes < CACHE_MINUTES) {
    return new Response(JSON.stringify({ articles: cached.articles, cached: true }), { status: 200, headers: corsHeaders })
  }

  const apiKey = Deno.env.get('GNEWS_API_KEY')
  if (!apiKey) {
    // Not configured yet — serve whatever's cached (even stale) rather
    // than an empty panel or a hard error.
    console.warn('get-agency-news: GNEWS_API_KEY not set')
    return new Response(JSON.stringify({ articles: cached?.articles || [], cached: true }), { status: 200, headers: corsHeaders })
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(GNEWS_QUERY)}&lang=en&country=ph&max=8&apikey=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GNews responded ${res.status}`)
    const json = await res.json()

    const articles: Article[] = (json.articles || []).map((a: Record<string, unknown>) => ({
      title: a.title as string,
      url: a.url as string,
      source: (a.source as { name?: string } | undefined)?.name || '',
      publishedAt: a.publishedAt as string,
      image: (a.image as string | undefined) || null,
    }))

    await supabaseAdmin.from('news_cache').upsert({ query_key: QUERY_KEY, articles, fetched_at: new Date().toISOString() })

    return new Response(JSON.stringify({ articles, cached: false }), { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error('get-agency-news: unexpected error', err)
    // Serve stale cache on failure rather than an empty panel.
    return new Response(JSON.stringify({ articles: cached?.articles || [], cached: true, error: true }), { status: 200, headers: corsHeaders })
  }
})
