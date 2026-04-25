'use client'

import { upload } from '@vercel/blob/client'

const BLOB_ENABLED = process.env.NEXT_PUBLIC_BLOB_ENABLED === '1'

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

async function maybeConvertHeic(file: File): Promise<File> {
  if (!isHeic(file)) return file
  const { heicTo } = await import('heic-to')
  const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 })
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  return new File([blob], newName, { type: 'image/jpeg' })
}

export type UploadedFile = { url: string; file: File } | { file: File }

// Returns a list of File / URL pairs. In Blob mode, each File is also uploaded
// and the returned `url` is the blob URL. In local-dev fallback mode, only the
// File is returned; the server action will save it as before.
export async function prepareUploads(files: File[]): Promise<UploadedFile[]> {
  if (!BLOB_ENABLED) {
    // Convert HEIC client-side anyway so the dev path also works smoothly
    const converted = await Promise.all(files.map(maybeConvertHeic))
    return converted.map((file) => ({ file }))
  }
  const out: UploadedFile[] = []
  for (const original of files) {
    const file = await maybeConvertHeic(original)
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
      contentType: file.type || 'image/jpeg',
    })
    out.push({ url: blob.url, file })
  }
  return out
}

export const blobEnabled = BLOB_ENABLED
