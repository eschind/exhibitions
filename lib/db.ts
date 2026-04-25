import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const db = new Database(path.join(dataDir, 'exhibitions.db'))
db.pragma('journal_mode = WAL')

db.exec(`
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

export function listExhibitions(): Exhibition[] {
  return db
    .prepare(
      `SELECT * FROM exhibitions ORDER BY date_visited DESC NULLS LAST, id DESC`
    )
    .all() as Exhibition[]
}

export function getExhibition(id: number): Exhibition | undefined {
  return db.prepare(`SELECT * FROM exhibitions WHERE id = ?`).get(id) as
    | Exhibition
    | undefined
}

export function deleteExhibition(id: number): Exhibition | undefined {
  const row = getExhibition(id)
  if (!row) return undefined
  db.prepare(`DELETE FROM exhibitions WHERE id = ?`).run(id)
  return row
}

export function createExhibition(input: ExhibitionInput): number {
  const stmt = db.prepare(`
    INSERT INTO exhibitions (title, venue, artists, hero_image, city, date_visited, description, photos, notes, link)
    VALUES (@title, @venue, @artists, @hero_image, @city, @date_visited, @description, @photos, @notes, @link)
  `)
  const info = stmt.run(input)
  return Number(info.lastInsertRowid)
}

export default db
