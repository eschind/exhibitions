import * as cheerio from 'cheerio'
import { lookupCityFromVenue } from './venues'

function looksLikePersonName(s: string): boolean {
  if (!s) return false
  const trimmed = s.trim()
  if (trimmed.length > 60) return false
  if (/\d/.test(trimmed)) return false
  const tokens = trimmed.split(/\s+/)
  if (tokens.length < 2 || tokens.length > 5) return false
  // Allow particles like "van", "de", "von", "der"
  const particles = new Set(['van', 'de', 'von', 'der', 'da', 'di', 'del', 'la', 'le'])
  const capCount = tokens.filter(
    (t) => /^[A-Z]/.test(t) || particles.has(t.toLowerCase())
  ).length
  return capCount === tokens.length
}

function inferArtistFromTitle(title?: string): string | undefined {
  if (!title) return undefined
  // Strip a trailing site-name suffix joined by | — – or :
  const m = title.match(/^(.+?)\s+[|—–:]\s+.+$/)
  const candidate = (m ? m[1] : title).trim()
  // Multiple artists separated by " and " or " & "
  const parts = candidate.split(/\s+(?:and|&)\s+/i).map((p) => p.trim())
  if (parts.every(looksLikePersonName)) return parts.join(', ')
  return undefined
}

export type ScrapedExhibition = {
  title?: string
  venue?: string
  artists?: string
  hero_image?: string
  city?: string
  description?: string
}

function abs(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url, base).toString()
  } catch {
    return undefined
  }
}

async function fetchHtmlDirect(link: string): Promise<string> {
  const res = await fetch(link, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`status ${res.status}`)
  const html = await res.text()
  if (/Just a moment\.\.\.|cf-browser-verification|challenge-platform/i.test(html)) {
    throw new Error('blocked by anti-bot challenge')
  }
  return html
}

async function fetchHtmlViaNimble(link: string): Promise<string> {
  const key = process.env.NIMBLE_API_KEY
  if (!key) throw new Error('Nimble not configured')
  const res = await fetch('https://api.webit.live/api/v1/realtime/web', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: link,
      method: 'GET',
      render: true,
      format: 'html',
    }),
  })
  if (!res.ok) throw new Error(`nimble ${res.status}`)
  return await res.text()
}

async function fetchHtml(link: string): Promise<string> {
  if (process.env.NIMBLE_API_KEY) {
    try {
      return await fetchHtmlViaNimble(link)
    } catch {
      // fall through to direct
    }
  }
  return await fetchHtmlDirect(link)
}

async function fetchViaMicrolink(link: string): Promise<ScrapedExhibition> {
  const res = await fetch(
    `https://api.microlink.io/?url=${encodeURIComponent(link)}`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error(`microlink ${res.status}`)
  const json = (await res.json()) as {
    status?: string
    data?: {
      title?: string
      description?: string
      author?: string
      publisher?: string
      image?: { url?: string } | string
      url?: string
    }
  }
  if (json.status !== 'success' || !json.data) {
    throw new Error('microlink: no data')
  }
  const d = json.data
  const image =
    typeof d.image === 'string' ? d.image : d.image?.url || undefined
  const venue =
    d.publisher ||
    (() => {
      try {
        return new URL(link).hostname.replace(/^www\./, '')
      } catch {
        return undefined
      }
    })()
  return {
    title: d.title,
    description: d.description,
    hero_image: image,
    venue,
    city: lookupCityFromVenue(venue),
    artists: inferArtistFromTitle(d.title),
  }
}

export async function scrapeExhibition(link: string): Promise<ScrapedExhibition> {
  let html: string
  try {
    html = await fetchHtml(link)
  } catch {
    return await fetchViaMicrolink(link)
  }
  const $ = cheerio.load(html)

  const meta = (name: string) =>
    $(`meta[property="${name}"]`).attr('content') ||
    $(`meta[name="${name}"]`).attr('content')

  const title =
    meta('og:title') ||
    meta('twitter:title') ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    undefined

  const description =
    meta('og:description') ||
    meta('description') ||
    meta('twitter:description') ||
    undefined

  const hero_image = abs(meta('og:image') || meta('twitter:image'), link)

  const siteName = meta('og:site_name')
  const host = (() => {
    try {
      return new URL(link).hostname.replace(/^www\./, '')
    } catch {
      return undefined
    }
  })()
  const venue = siteName || host

  // Heuristic: pull from JSON-LD if present
  let artists: string | undefined
  let city: string | undefined
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text())
      const items = Array.isArray(json) ? json : [json]
      for (const item of items) {
        if (!item) continue
        if (!artists) {
          const performer = item.performer || item.creator || item.author
          if (performer) {
            const arr = Array.isArray(performer) ? performer : [performer]
            artists = arr
              .map((p: { name?: string } | string) =>
                typeof p === 'string' ? p : p?.name
              )
              .filter(Boolean)
              .join(', ') || undefined
          }
        }
        if (!city) {
          const loc = item.location
          const addr = loc?.address || loc
          if (addr?.addressLocality) city = addr.addressLocality
        }
      }
    } catch {
      // ignore
    }
  })

  return {
    title: title || undefined,
    venue: venue || undefined,
    artists: artists || inferArtistFromTitle(title),
    hero_image,
    city: city || lookupCityFromVenue(venue),
    description: description || undefined,
  }
}
