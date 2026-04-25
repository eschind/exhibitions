'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeExhibition } from '@/app/actions'

type Props = {
  id: number
  title: string
  variant?: 'card' | 'page'
}

export default function ExhibitionMenu({ id, title, variant = 'card' }: Props) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!confirming) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) setConfirming(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirming, isPending])

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const openConfirm = (e: React.MouseEvent) => {
    stop(e)
    setOpen(false)
    setConfirming(true)
  }

  const performDelete = () => {
    startTransition(async () => {
      await removeExhibition(id)
      setConfirming(false)
      if (variant === 'page') {
        router.push('/')
      }
      router.refresh()
    })
  }

  const triggerClass =
    variant === 'card'
      ? 'w-6 h-6 flex items-center justify-center text-neutral-300 hover:text-neutral-700 transition-colors text-base leading-none'
      : 'w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-black transition-colors text-xl leading-none'

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(e) => {
            stop(e)
            setOpen((v) => !v)
          }}
          className={triggerClass}
        >
          ⋯
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 mt-1 min-w-[140px] bg-white border border-black z-10 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={openConfirm}
              className="block w-full text-left px-4 py-2 hover:bg-black hover:text-white"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            stop(e)
            if (!isPending) setConfirming(false)
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative bg-white border border-black w-full max-w-md mx-6 p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-title"
              className="text-2xl font-light leading-tight mb-3"
            >
              Delete this exhibition?
            </h2>
            <p className="text-sm text-neutral-600 mb-8">
              <span className="block mb-1 text-neutral-500 uppercase tracking-widest text-xs">
                {title}
              </span>
              This will remove the entry and all uploaded photos. This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={(e) => {
                  stop(e)
                  if (!isPending) setConfirming(false)
                }}
                disabled={isPending}
                className="text-xs uppercase tracking-widest border border-black px-5 py-2 hover:bg-neutral-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  stop(e)
                  performDelete()
                }}
                disabled={isPending}
                className="text-xs uppercase tracking-widest border border-black bg-black text-white px-5 py-2 hover:bg-white hover:text-black disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
