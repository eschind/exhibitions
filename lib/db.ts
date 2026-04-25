import { createClient, type Client } from '@libsql/client'
import path from 'path'
import fs from 'fs'

let _client: Client | null = null

function client(): Client {
  if (_client) return _client
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (url) {
    _client = createClient({ url, authToken })
  } else {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    _client = createClient({
      url: `file:${path.join(dataDir, 'exhibitions.db')}`,
    })
  }
  return _client
}

let _initialized = false
async function ensureSchema() {
  if (_initialized) return
  await client().execute(`
    CREATE TABLE IF NOT EXISTS exhibitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      venue TEXT,
      artists TEXT,
      hero_image TEXT,
      city TEXT,
      date_visited TEXT,
      description TEXT,
      photos TEXT,
      notes TEXT,
      link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  _initialized = true
}

export type Exhibition = {
  id: number
  title: string
  venue: string | null
  artists: string | null
  hero_image: string | null
  city: string | null
  date_visited: string | null
  description: string | null
  photos: string | null
  notes: string | null
  link: string | null
  created_at: string
}

export type ExhibitionInput = Omit<Exhibition, 'id' | 'created_at'>

function toExhibition(
  row: Record<string, unknown> | undefined
): Exhibition | undefined {
  if (!row) return undefined
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    venue: (row.venue as string | null) ?? null,
    artists: (row.artists as string | null) ?? null,
    hero_image: (row.hero_image as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    date_visited: (row.date_visited as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    photos: (row.photos as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    link: (row.link as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
  }
}

export async function listExhibitions(): Promise<Exhibition[]> {
  await ensureSchema()
  const res = await client().execute(
    `SELECT * FROM exhibitions ORDER BY date_visited DESC, id DESC`
  )
  return res.rows
    .map((r) => toExhibition(r as unknown as Record<string, unknown>))
    .filter((x): x is Exhibition => Boolean(x))
}

export async function getExhibition(id: number): Promise<Exhibition | undefined> {
  await ensureSchema()
  const res = await client().execute({
    sql: `SELECT * FROM exhibitions WHERE id = ?`,
    args: [id],
  })
  return toExhibition(res.rows[0] as unknown as Record<string, unknown> | undefined)
}

export async function createExhibition(input: ExhibitionInput): Promise<number> {
  await ensureSchema()
  const res = await client().execute({
    sql: `INSERT INTO exhibitions (title, venue, artists, hero_image, city, date_visited, description, photos, notes, link)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.title,
      input.venue,
      input.artists,
      input.hero_image,
      input.city,
      input.date_visited,
      input.description,
      input.photos,
      input.notes,
      input.link,
    ],
  })
  return Number(res.lastInsertRowid)
}

export async function deleteExhibition(
  id: number
): Promise<Exhibition | undefined> {
  await ensureSchema()
  const row = await getExhibition(id)
  if (!row) return undefined
  await client().execute({
    sql: `DELETE FROM exhibitions WHERE id = ?`,
    args: [id],
  })
  return row
}
