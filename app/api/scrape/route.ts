import { NextResponse } from 'next/server'
import { scrapeExhibition } from '@/lib/scrape'
import { auth } from '@/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
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
