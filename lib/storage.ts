import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function makeName(originalName: string, fallbackExt = '.jpg'): string {
  const ext = path.extname(originalName) || fallbackExt
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
}

export async function saveUpload(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  forceExt?: string
): Promise<string> {
  const name = makeName(forceExt ? `x${forceExt}` : originalName)

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(name, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    })
    return blob.url
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer)
  return `/uploads/${name}`
}

export async function deleteUpload(urlOrPath: string): Promise<void> {
  if (!urlOrPath) return
  const isLocal = urlOrPath.startsWith('/uploads/')
  if (isLocal) {
    const filePath = path.join(
      process.cwd(),
      'public',
      urlOrPath.replace(/^\//, '')
    )
    await fs.unlink(filePath).catch(() => {})
    return
  }
  if (process.env.BLOB_READ_WRITE_TOKEN && urlOrPath.startsWith('http')) {
    const { del } = await import('@vercel/blob')
    await del(urlOrPath).catch(() => {})
  }
}
