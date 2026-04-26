'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import path from 'path'
import {
  createExhibition,
  deleteExhibition,
  getExhibition,
  markExhibitionVisited,
  savePreferences as dbSavePreferences,
  updateExhibitionPhotos,
  type Preferences,
} from '@/lib/db'
import { requireUserId } from '@/lib/session'
import { parsePhotos } from '@/lib/format'
import { saveUpload, deleteUpload } from '@/lib/storage'

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
  let buf = Buffer.from(await file.arrayBuffer())
  let contentType = file.type || 'application/octet-stream'
  let forceExt: string | undefined
  if (isHeic(file)) {
    const heicConvert = (await import('heic-convert')).default
    const out = await heicConvert({
      buffer: new Uint8Array(buf),
      format: 'JPEG',
      quality: 0.9,
    })
    buf = Buffer.from(out)
    contentType = 'image/jpeg'
    forceExt = '.jpg'
  } else if (!path.extname(file.name)) {
    forceExt = '.jpg'
  }
  return saveUpload(buf, file.name, contentType, forceExt)
}

export async function addExhibition(formData: FormData) {
  const userId = await requireUserId()
  const status =
    (formData.get('status') as string) === 'wishlist' ? 'wishlist' : 'visited'
  const link = (formData.get('link') as string) || null
  const title = (formData.get('title') as string)?.trim()
  if (!title) throw new Error('Title is required')
  const venue = (formData.get('venue') as string) || null
  const artists = (formData.get('artists') as string) || null
  const city = (formData.get('city') as string) || null
  const date_visited_raw = ((formData.get('date_visited') as string) || '').trim()
  if (status === 'visited' && !date_visited_raw) {
    throw new Error('Date visited is required')
  }
  const date_visited = date_visited_raw || null
  const description = (formData.get('description') as string) || null
  const notes = (formData.get('notes') as string) || null
  const hero_image_url = (formData.get('hero_image_url') as string) || null

  let hero_image: string | null = hero_image_url
  const heroBlobUrl = (formData.get('hero_image_blob_url') as string) || null
  if (heroBlobUrl) {
    hero_image = heroBlobUrl
  } else {
    const heroFile = formData.get('hero_image_file') as File | null
    if (heroFile && heroFile.size > 0) {
      hero_image = await saveFile(heroFile)
    }
  }

  const photoUrlsRaw = formData.getAll('photo_urls') as string[]
  const photoPaths: string[] = photoUrlsRaw.filter((u) => typeof u === 'string' && u)
  if (photoPaths.length === 0) {
    const photoFiles = formData.getAll('photos') as File[]
    for (const f of photoFiles) {
      if (f && f.size > 0) photoPaths.push(await saveFile(f))
    }
  }

  const id = await createExhibition(
    {
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
      status,
    },
    userId
  )

  revalidatePath('/')
  revalidatePath('/wishlist')
  if (status === 'wishlist') {
    redirect('/wishlist')
  }
  redirect(`/exhibition/${id}`)
}

export async function addPhotosToExhibition(formData: FormData) {
  const userId = await requireUserId()
  const idRaw = formData.get('id')
  const id = Number(idRaw)
  if (!id) throw new Error('Missing exhibition id')
  const existing = await getExhibition(id, userId)
  if (!existing) throw new Error('Exhibition not found')

  const photoUrlsRaw = formData.getAll('photo_urls') as string[]
  const newPaths: string[] = photoUrlsRaw.filter((u) => typeof u === 'string' && u)
  if (newPaths.length === 0) {
    const files = formData.getAll('photos') as File[]
    for (const f of files) {
      if (f && f.size > 0) newPaths.push(await saveFile(f))
    }
  }
  if (newPaths.length === 0) return

  const current = parsePhotos(existing.photos)
  const next = [...current, ...newPaths]
  await updateExhibitionPhotos(id, userId, JSON.stringify(next))
  revalidatePath(`/exhibition/${id}`)
}

export async function removeExhibition(id: number) {
  const userId = await requireUserId()
  const row = await deleteExhibition(id, userId)
  if (!row) return
  const files = [
    ...(row.hero_image ? [row.hero_image] : []),
    ...parsePhotos(row.photos),
  ]
  await Promise.all(files.map((url) => deleteUpload(url)))
  revalidatePath('/')
  revalidatePath('/wishlist')
}

export async function markAsVisited(formData: FormData) {
  const userId = await requireUserId()
  const id = Number(formData.get('id'))
  if (!id) throw new Error('Missing exhibition id')
  const date_visited = ((formData.get('date_visited') as string) || '').trim()
  if (!date_visited) throw new Error('Date visited is required')
  const notes = (formData.get('notes') as string) || null

  const existing = await getExhibition(id, userId)
  if (!existing) throw new Error('Exhibition not found')

  const photoUrlsRaw = formData.getAll('photo_urls') as string[]
  const newPaths: string[] = photoUrlsRaw.filter(
    (u) => typeof u === 'string' && u
  )
  if (newPaths.length === 0) {
    const files = formData.getAll('photos') as File[]
    for (const f of files) {
      if (f && f.size > 0) newPaths.push(await saveFile(f))
    }
  }
  const merged = [...parsePhotos(existing.photos), ...newPaths]
  const photosJson = merged.length ? JSON.stringify(merged) : null

  await markExhibitionVisited(id, userId, {
    date_visited,
    notes,
    photos: photosJson,
  })
  revalidatePath('/')
  revalidatePath('/wishlist')
  revalidatePath(`/exhibition/${id}`)
  redirect(`/exhibition/${id}`)
}

export async function savePreferences(prefs: Preferences) {
  const userId = await requireUserId()
  await dbSavePreferences(userId, prefs)
  revalidatePath('/wishlist')
}
