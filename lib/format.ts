function parseLocalDate(dateStr: string): Date | null {
  // Treat YYYY-MM-DD as a local calendar date, not UTC midnight.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr)
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function quarterOf(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = parseLocalDate(dateStr)
  if (!d) return null
  const q = Math.floor(d.getMonth() / 3) + 1
  return `${d.getFullYear()} Q${q}`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = parseLocalDate(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = parseLocalDate(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function parsePhotos(json: string | null): string[] {
  if (!json) return []
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function splitArtists(s: string | null): string[] {
  if (!s) return []
  return s
    .split(/[,;&]| and /i)
    .map((x) => x.trim())
    .filter(Boolean)
}
