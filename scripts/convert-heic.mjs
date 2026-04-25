import fs from 'fs/promises'
import path from 'path'
import Database from 'better-sqlite3'
import heicConvert from 'heic-convert'

const root = process.cwd()
const uploads = path.join(root, 'public', 'uploads')
const db = new Database(path.join(root, 'data', 'exhibitions.db'))

const files = await fs.readdir(uploads)
const map = new Map() // /uploads/old.HEIC -> /uploads/new.jpg

for (const f of files) {
  if (!/\.heic$|\.heif$/i.test(f)) continue
  const fp = path.join(uploads, f)
  const buf = await fs.readFile(fp)
  console.log('Converting', f)
  const out = await heicConvert({
    buffer: new Uint8Array(buf),
    format: 'JPEG',
    quality: 0.9,
  })
  const newName = f.replace(/\.(heic|heif)$/i, '.jpg')
  await fs.writeFile(path.join(uploads, newName), Buffer.from(out))
  await fs.unlink(fp)
  map.set(`/uploads/${f}`, `/uploads/${newName}`)
}

const rows = db.prepare('SELECT id, hero_image, photos FROM exhibitions').all()
const updateStmt = db.prepare(
  'UPDATE exhibitions SET hero_image = ?, photos = ? WHERE id = ?'
)
for (const row of rows) {
  let hero = row.hero_image
  if (hero && map.has(hero)) hero = map.get(hero)
  let photos = row.photos
  if (photos) {
    try {
      const arr = JSON.parse(photos)
      const next = arr.map((p) => map.get(p) || p)
      photos = JSON.stringify(next)
    } catch {}
  }
  updateStmt.run(hero, photos, row.id)
}

console.log(`Converted ${map.size} files, updated ${rows.length} rows.`)
