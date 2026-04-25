import { NextResponse } from 'next/server'
import { scrapeExhibition } from '@/lib/scrape'

export async function POST(req: Request) {
  try {
    const { link } = await req.json()
    if (!link || typeof link !== 'string') {
      return NextResponse.json({ error: 'Missing link' }, { status: 400 })
    }
    const data = await scrapeExhibition(link)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scrape failed' },
      { status: 500 }
    )
  }
}
