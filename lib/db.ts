import path from 'path'
import fs from 'fs'

export type ExhibitionStatus = 'visited' | 'wishlist'

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
  status: ExhibitionStatus
  created_at: string
}

export type ExhibitionInput = Omit<Exhibition, 'id' | 'created_at'>

export type Preferences = {
  artists: string[]
  cities: string[]
  venues: string[]
}

export type User = {
  id: number
  email: string
  name: string | null
  image: string | null
  created_at: string
}

const POSTGRES_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  ''

const usePostgres = Boolean(POSTGRES_URL)
const OWNER_EMAIL = (process.env.OWNER_EMAIL || '').toLowerCase()

function toExhibition(
  row: Record<string, unknown> | undefined
): Exhibition | undefined {
  if (!row) return undefined
  const created = row.created_at
  const status = (row.status as string | null) === 'wishlist' ? 'wishlist' : 'visited'
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
    status,
    created_at:
      created instanceof Date
        ? created.toISOString()
        : String(created ?? ''),
  }
}

function toUser(row: Record<string, unknown> | undefined): User | undefined {
  if (!row) return undefined
  const created = row.created_at
  return {
    id: Number(row.id),
    email: String(row.email ?? ''),
    name: (row.name as string | null) ?? null,
    image: (row.image as string | null) ?? null,
    created_at:
      created instanceof Date
        ? created.toISOString()
        : String(created ?? ''),
  }
}

let _pg: ReturnType<
  typeof import('@neondatabase/serverless').neon
> | null = null

async function pg() {
  if (_pg) return _pg
  const { neon } = await import('@neondatabase/serverless')
  _pg = neon(POSTGRES_URL)
  return _pg
}

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
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
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
    await sql`
      ALTER TABLE exhibitions
        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    `
    await sql`
      ALTER TABLE exhibitions
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'visited'
    `
    await sql`CREATE INDEX IF NOT EXISTS exhibitions_user_id_idx ON exhibitions(user_id)`
    await sql`
      CREATE TABLE IF NOT EXISTS preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        artists TEXT,
        cities TEXT,
        venues TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  } else {
    const c = await libsql()
    await c.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
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
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const cols = await c.execute(`PRAGMA table_info(exhibitions)`)
    const colNames = cols.rows.map(
      (r) => (r as unknown as { name: string }).name
    )
    if (!colNames.includes('user_id')) {
      await c.execute(
        `ALTER TABLE exhibitions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
      )
    }
    if (!colNames.includes('status')) {
      await c.execute(
        `ALTER TABLE exhibitions ADD COLUMN status TEXT NOT NULL DEFAULT 'visited'`
      )
    }
    await c.execute(`
      CREATE TABLE IF NOT EXISTS preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        artists TEXT,
        cities TEXT,
        venues TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }
  _initialized = true
}

// Users --------------------------------------------------------------------

export async function upsertUserFromOAuth(input: {
  email: string
  name: string | null
  image: string | null
}): Promise<number> {
  await ensureSchema()
  const email = input.email.toLowerCase()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`
      INSERT INTO users (email, name, image)
      VALUES (${email}, ${input.name}, ${input.image})
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image
      RETURNING id
    `) as Array<{ id: number }>
    const id = Number(rows[0].id)
    if (OWNER_EMAIL && email === OWNER_EMAIL) {
      await sql`UPDATE exhibitions SET user_id = ${id} WHERE user_id IS NULL`
    }
    return id
  }
  const c = await libsql()
  await c.execute({
    sql: `INSERT INTO users (email, name, image) VALUES (?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET name = excluded.name, image = excluded.image`,
    args: [email, input.name, input.image],
  })
  const res = await c.execute({
    sql: `SELECT id FROM users WHERE email = ?`,
    args: [email],
  })
  const id = Number((res.rows[0] as unknown as { id: number }).id)
  if (OWNER_EMAIL && email === OWNER_EMAIL) {
    await c.execute({
      sql: `UPDATE exhibitions SET user_id = ? WHERE user_id IS NULL`,
      args: [id],
    })
  }
  return id
}

export async function getUserById(id: number): Promise<User | undefined> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`SELECT * FROM users WHERE id = ${id}`) as Record<
      string,
      unknown
    >[]
    return toUser(rows[0])
  }
  const c = await libsql()
  const res = await c.execute({ sql: `SELECT * FROM users WHERE id = ?`, args: [id] })
  return toUser(res.rows[0] as unknown as Record<string, unknown>)
}

// Exhibitions --------------------------------------------------------------

export async function listExhibitions(
  userId: number,
  status: ExhibitionStatus = 'visited'
): Promise<Exhibition[]> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`
      SELECT * FROM exhibitions
      WHERE user_id = ${userId} AND status = ${status}
      ORDER BY date_visited DESC NULLS LAST, id DESC
    `) as Record<string, unknown>[]
    return rows
      .map((r) => toExhibition(r))
      .filter((x): x is Exhibition => Boolean(x))
  }
  const c = await libsql()
  const res = await c.execute({
    sql: `SELECT * FROM exhibitions WHERE user_id = ? AND status = ? ORDER BY date_visited DESC, id DESC`,
    args: [userId, status],
  })
  return res.rows
    .map((r) => toExhibition(r as unknown as Record<string, unknown>))
    .filter((x): x is Exhibition => Boolean(x))
}

export async function getExhibition(
  id: number,
  userId: number
): Promise<Exhibition | undefined> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`
      SELECT * FROM exhibitions WHERE id = ${id} AND user_id = ${userId}
    `) as Record<string, unknown>[]
    return toExhibition(rows[0])
  }
  const c = await libsql()
  const res = await c.execute({
    sql: `SELECT * FROM exhibitions WHERE id = ? AND user_id = ?`,
    args: [id, userId],
  })
  return toExhibition(res.rows[0] as unknown as Record<string, unknown>)
}

export async function createExhibition(
  input: ExhibitionInput,
  userId: number
): Promise<number> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`
      INSERT INTO exhibitions (title, venue, artists, hero_image, city, date_visited, description, photos, notes, link, user_id, status)
      VALUES (${input.title}, ${input.venue}, ${input.artists}, ${input.hero_image}, ${input.city}, ${input.date_visited}, ${input.description}, ${input.photos}, ${input.notes}, ${input.link}, ${userId}, ${input.status})
      RETURNING id
    `) as Array<{ id: number }>
    return Number(rows[0].id)
  }
  const c = await libsql()
  const res = await c.execute({
    sql: `INSERT INTO exhibitions (title, venue, artists, hero_image, city, date_visited, description, photos, notes, link, user_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      userId,
      input.status,
    ],
  })
  return Number(res.lastInsertRowid)
}

export async function markExhibitionVisited(
  id: number,
  userId: number,
  patch: { date_visited: string; notes?: string | null; photos?: string | null }
): Promise<void> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    await sql`
      UPDATE exhibitions
      SET status = 'visited',
          date_visited = ${patch.date_visited},
          notes = COALESCE(${patch.notes ?? null}, notes),
          photos = COALESCE(${patch.photos ?? null}, photos)
      WHERE id = ${id} AND user_id = ${userId}
    `
  } else {
    const c = await libsql()
    await c.execute({
      sql: `UPDATE exhibitions
            SET status = 'visited',
                date_visited = ?,
                notes = COALESCE(?, notes),
                photos = COALESCE(?, photos)
            WHERE id = ? AND user_id = ?`,
      args: [patch.date_visited, patch.notes ?? null, patch.photos ?? null, id, userId],
    })
  }
}

export async function updateExhibitionPhotos(
  id: number,
  userId: number,
  photosJson: string | null
): Promise<void> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    await sql`UPDATE exhibitions SET photos = ${photosJson} WHERE id = ${id} AND user_id = ${userId}`
  } else {
    const c = await libsql()
    await c.execute({
      sql: `UPDATE exhibitions SET photos = ? WHERE id = ? AND user_id = ?`,
      args: [photosJson, id, userId],
    })
  }
}

export async function deleteExhibition(
  id: number,
  userId: number
): Promise<Exhibition | undefined> {
  await ensureSchema()
  const row = await getExhibition(id, userId)
  if (!row) return undefined
  if (usePostgres) {
    const sql = await pg()
    await sql`DELETE FROM exhibitions WHERE id = ${id} AND user_id = ${userId}`
  } else {
    const c = await libsql()
    await c.execute({
      sql: `DELETE FROM exhibitions WHERE id = ? AND user_id = ?`,
      args: [id, userId],
    })
  }
  return row
}

// Preferences -------------------------------------------------------------

function emptyPrefs(): Preferences {
  return { artists: [], cities: [], venues: [] }
}

function parseList(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : []
  } catch {
    return []
  }
}

export async function getPreferences(userId: number): Promise<Preferences> {
  await ensureSchema()
  if (usePostgres) {
    const sql = await pg()
    const rows = (await sql`
      SELECT artists, cities, venues FROM preferences WHERE user_id = ${userId}
    `) as Array<{ artists: string | null; cities: string | null; venues: string | null }>
    if (rows.length === 0) return emptyPrefs()
    const r = rows[0]
    return {
      artists: parseList(r.artists),
      cities: parseList(r.cities),
      venues: parseList(r.venues),
    }
  }
  const c = await libsql()
  const res = await c.execute({
    sql: `SELECT artists, cities, venues FROM preferences WHERE user_id = ?`,
    args: [userId],
  })
  if (res.rows.length === 0) return emptyPrefs()
  const r = res.rows[0] as unknown as {
    artists: string | null
    cities: string | null
    venues: string | null
  }
  return {
    artists: parseList(r.artists),
    cities: parseList(r.cities),
    venues: parseList(r.venues),
  }
}

export async function savePreferences(
  userId: number,
  prefs: Preferences
): Promise<void> {
  await ensureSchema()
  const a = JSON.stringify(prefs.artists)
  const c = JSON.stringify(prefs.cities)
  const v = JSON.stringify(prefs.venues)
  if (usePostgres) {
    const sql = await pg()
    await sql`
      INSERT INTO preferences (user_id, artists, cities, venues, updated_at)
      VALUES (${userId}, ${a}, ${c}, ${v}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        artists = EXCLUDED.artists,
        cities = EXCLUDED.cities,
        venues = EXCLUDED.venues,
        updated_at = NOW()
    `
    return
  }
  const client = await libsql()
  await client.execute({
    sql: `INSERT INTO preferences (user_id, artists, cities, venues) VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            artists = excluded.artists,
            cities = excluded.cities,
            venues = excluded.venues,
            updated_at = CURRENT_TIMESTAMP`,
    args: [userId, a, c, v],
  })
}

export async function hasPreferences(userId: number): Promise<boolean> {
  const p = await getPreferences(userId)
  return p.artists.length + p.cities.length + p.venues.length > 0
}
