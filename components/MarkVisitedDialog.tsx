'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAsVisited } from '@/app/actions'
import { prepareUploads, blobEnabled } from '@/lib/clientUpload'

export default function MarkVisitedDialog({
  id,
  title,
  variant = 'card',
}: {
  id: number
  title: string
  variant?: 'card' | 'page'
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, isPending])

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)
    const formEl = e.currentTarget
    startTransition(async () => {
      try {
        const formData = new FormData(formEl)
        if (blobEnabled) {
          const photoFiles = formData
            .getAll('photos')
            .filter((f): f is File => f instanceof File && f.size > 0)
          if (photoFiles.length > 0) {
            const uploaded = await prepareUploads(photoFiles)
            for (const u of uploaded) {
              if ('url' in u) formData.append('photo_urls', u.url)
            }
          }
          formData.delete('photos')
        }
        await markAsVisited(formData)
        setOpen(false)
        router.refresh()
      } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') return
        setError(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  const triggerClass =
    variant === 'card'
      ? 'text-xs uppercase tracking-widest border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors'
      : 'text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors'

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          stop(e)
          setOpen(true)
        }}
        className={triggerClass}
      >
        Mark visited
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            stop(e)
            if (!isPending) setOpen(false)
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            role="dialog"
            aria-modal="true"
            className="relative bg-white border border-black w-full max-w-lg mx-6 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
              {title}
            </div>
            <h2 className="text-2xl font-light leading-tight mb-6">
              Mark as visited
            </h2>
            <form onSubmit={onSubmit} className="space-y-6">
              <input type="hidden" name="id" value={id} />
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-neutral-500 block mb-2">
                  Date visited *
                </span>
                <input
                  name="date_visited"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent border-b border-black py-2 text-lg font-light focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-neutral-500 block mb-2">
                  Notes
                </span>
                <textarea
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-transparent border border-black py-2 px-3 font-light focus:outline-none resize-y"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-neutral-500 block mb-2">
                  Photos
                </span>
                <input
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="text-sm"
                />
              </label>
              {error ? <div className="text-sm text-red-700">{error}</div> : null}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e)
                    if (!isPending) setOpen(false)
                  }}
                  disabled={isPending}
                  className="text-xs uppercase tracking-widest border border-black px-5 py-2 hover:bg-neutral-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-xs uppercase tracking-widest border border-black bg-black text-white px-5 py-2 hover:bg-white hover:text-black disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : 'Mark visited'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
