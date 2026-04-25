'use client'

import { useRef, useState, useTransition } from 'react'
import { addPhotosToExhibition } from '@/app/actions'
import { prepareUploads, blobEnabled } from '@/lib/clientUpload'

export default function AddPhotosForm({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formEl = e.currentTarget
    startTransition(async () => {
      try {
        const fd = new FormData(formEl)
        const files = fd
          .getAll('photos')
          .filter((f): f is File => f instanceof File && f.size > 0)
        if (files.length === 0) return

        if (blobEnabled) {
          const uploaded = await prepareUploads(files)
          fd.delete('photos')
          for (const u of uploaded) {
            if ('url' in u) fd.append('photo_urls', u.url)
          }
        }

        await addPhotosToExhibition(fd)
        formRef.current?.reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload')
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex items-center gap-3"
    >
      <input type="hidden" name="id" value={id} />
      <input
        ref={inputRef}
        type="file"
        name="photos"
        accept="image/*"
        multiple
        disabled={isPending}
        onChange={() => formRef.current?.requestSubmit()}
        className="hidden"
        id={`add-photos-${id}`}
      />
      <label
        htmlFor={`add-photos-${id}`}
        className="text-xs uppercase tracking-widest border border-black px-4 py-2 cursor-pointer hover:bg-black hover:text-white transition-colors"
        aria-disabled={isPending}
      >
        {isPending ? 'Uploading…' : 'Add photos'}
      </label>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </form>
  )
}
