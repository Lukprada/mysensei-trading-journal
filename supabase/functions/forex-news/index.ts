import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Forex Factory publishes free weekly JSON calendars (last / this / next week).
// We proxy them so the browser isn't blocked by CORS, and so we can cache cheaply.
const FEEDS = [
  'https://nfs.faireconomy.media/ff_calendar_lastweek.json',
  'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
]

interface FFEvent {
  title: string
  country: string
  date: string
  impact: string
  forecast: string
  previous: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    let date = url.searchParams.get('date') ?? ''
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      date = body?.date ?? date
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(JSON.stringify({ error: 'date must be YYYY-MM-DD' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = await Promise.all(
      FEEDS.map(async (feed) => {
        try {
          const res = await fetch(feed, { headers: { 'User-Agent': 'trading-journal/1.0' } })
          if (!res.ok) return [] as FFEvent[]
          return (await res.json()) as FFEvent[]
        } catch {
          return [] as FFEvent[]
        }
      }),
    )

    const all = results.flat()
    const events = all
      .filter((e) => typeof e?.date === 'string' && e.date.slice(0, 10) === date)
      .map((e) => ({
        title: e.title,
        currency: e.country,
        impact: (e.impact || '').toLowerCase(),
        time: e.date,
        forecast: e.forecast || '',
        previous: e.previous || '',
      }))
      .sort((a, b) => a.time.localeCompare(b.time))

    return new Response(
      JSON.stringify({
        date,
        events,
        covered: all.length > 0,
        note: all.length === 0
          ? 'Forex Factory feed unavailable right now.'
          : events.length === 0
            ? 'No events found for this date (the free feed only covers last / current / next week).'
            : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('forex-news error', err)
    return new Response(JSON.stringify({ error: 'Failed to load news' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
