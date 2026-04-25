'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import path from 'path'
import fs from 'fs/promises'
import { createExhibition, deleteExhibition } from '@/lib/db'
import { parsePhotos } from '@/lib/format'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  )
}

async function saveFile(file: File): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  let buf = Buffer.from(await file.arrayBuffer())
  let ext = path.extname(file.name) || '.jpg'
  if (isHeic(file)) {
    const heicConvert = (await import('heic-convert')).default
    const out = await heicConvert({
      buffer: new Uint8Array(buf),
      format: 'JPEG',
      quality: 0.9,
    })
    buf = Buffer.from(out)
    ext = '.jpg'
  }
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf)
  return `/uploads/${name}`
}

export async function addExhibition(formData: FormData) {
  const link = (formData.get('link') as string) || null
  const title = (formData.get('title') as string)?.trim()
  if (!title) throw new Error('Title is required')
  const venue = (formData.get('venue') as string) || null
  const artists = (formData.get('artists') as string) || null
  const city = (formData.get('city') as string) || null
  const date_visited = ((formData.get('date_visited') as string) || '').trim()
  if (!date_visited) throw new Error('Date visited is required')
  const description = (formData.get('description') as string) || null
  const notes = (formData.get('notes') as string) || null
  const hero_image_url = (formData.get('hero_image_url') as string) || null

  let hero_image: string | null = hero_image_url
  const heroFile = formData.get('hero_image_file') as File | null
  if (heroFile && heroFile.size > 0) {
    hero_image = await saveFile(heroFile)
  }

  const photoFiles = formData.getAll('photos') as File[]
  const photoPaths: string[] = []
  for (const f of photoFiles) {
    if (f && f.size > 0) photoPaths.push(await saveFile(f))
  }

  const id = createExhibition({
    title,
    venue,
    artists,
    hero_image,
    city,
    date_visited,
    description,
    photos: photoPaths.length ? JSON.stringify(photoPaths) : null,
    notes,
    link,
  })

  revalidatePath('/')
  redirect(`/exhibition/${id}`)
}

export async function removeExhibition(id: number) {
  const row = deleteExhibition(id)
  if (!row) return
  const files = [
    ...(row.hero_image && row.hero_image.startsWith('/uploads/')
      ? [row.hero_image]
      : []),
    ...parsePhotos(row.photos),
  ]
  await Promise.all(
    files.map(async (rel) => {
      const filePath = path.join(process.cwd(), 'public', rel.replace(/^\//, ''))
      await fs.unlink(filePath).catch(() => {})
    })
  )
  revalidatePath('/')
}

