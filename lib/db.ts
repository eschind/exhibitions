import path from 'path'
import fs from 'fs'

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

const POSTGRES_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  ''

const usePostgres = Boolean(POSTGRES_URL)

function toExhibition(
  row: Record<string, unknown> | undefined
): Exhibition | undefined {
  if (!row) return undefined
  const created = row.created_at
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
    created_at:
      created instanceof Date
        ? created.toISOString()
        : String(created ?? ''),
  }
}

// Postgres branch ----------------------------------------------------------

let _pg: ReturnType<
  typeof import('@neondatabase/serverless').neon
> | null = null

async function pg() {
  if (_pg) return _pg
  const { neon } = await import('@neondatabase/serverless')
  _pg = neon(POSTGRES_URL)
  return _pg
}

// SQLite (libsql) branch ---------------------------------------------------

let _libsql: import('@libsql/client').Client | null = null
async function libsql() {
  if (_libsql) return _libsql
  const { createClient } = await import('@libsql/client')
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  _libsql = createClient({
    url: `file:${path.join(dataDir, 'exhibitions.db')}`,
  })
  return _libsql
}

let _initialized = false
async function ensureSchema() {
  if (_initialized) return
  if (usePostgres) {
    const sql = await pg()
    await sql`
      CREATE TABLE IF NOT EXISTS exhibitions (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  } else {
    const c = await libsql()
    await c.execute(`
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
  }
  _initialized = true
}

// Public API ---------------------------------------------------------------

export async function listExhibitions(): Promise<Exhibition[]> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`
      SELECT * FROM exhibitions
      ORDER BY date_visited DESC NULLS LAST, id DESC
    `) as Record<string, unknown>[]
    return rows
      .map((r) => toExhibition(r))
      .filter((x): x is Exhibition => Boolean(x))
  }
  const c = await libsql()
  const res = await c.execute(
    `SELECT * FROM exhibitions ORDER BY date_visited DESC, id DESC`
  )
  return res.rows
    .map((r) => toExhibition(r as unknown as Record<string, unknown>))
    .filter((x): x is Exhibition => Boolean(x))
}

export async function getExhibition(
  id: number
): Promise<Exhibition | undefined> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`SELECT * FROM exhibitions WHERE id = ${id}`) as Record<
      string,
      unknown
    >[]
    return toExhibition(rows[0])
  }
  const c = await libsql()
  const res = await c.execute({
    sql: `SELECT * FROM exhibitions WHERE id = ?`,
    args: [id],
  })
  return toExhibition(res.rows[0] as unknown as Record<string, unknown>)
}

export async function createExhibition(
  input: ExhibitionInput
): Promise<number> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`
      INSERT INTO exhibitions (title, venue, artists, hero_image, city, date_visited, description, photos, notes, link)
      VALUES (${input.title}, ${input.venue}, ${input.artists}, ${input.hero_image}, ${input.city}, ${input.date_visited}, ${input.description}, ${input.photos}, ${input.notes}, ${input.link})
      RETURNING id
    `) as Array<{ id: number }>
    return Number(rows[0].id)
  }
  const c = await libsql()
  const res = await c.execute({
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
  if (usePostgres) {
    const sql = await pg()
    await sql`DELETE FROM exhibitions WHERE id = ${id}`
  } else {
    const c = await libsql()
    await c.execute({
      sql: `DELETE FROM exhibitions WHERE id = ?`,
      args: [id],
    })
  }
  return row
}
