'use client'

import { useState, useTransition } from 'react'
import { addExhibition } from '@/app/actions'

export default function NewExhibitionForm() {
  const [link, setLink] = useState('')
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [artists, setArtists] = useState('')
  const [city, setCity] = useState('')
  const [dateVisited, setDateVisited] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleScrape = async () => {
    if (!link) return
    setScraping(true)
    setScrapeError(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch')
      }
      const data = await res.json()
      if (data.title && !title) setTitle(data.title)
      if (data.venue && !venue) setVenue(data.venue)
      if (data.artists && !artists) setArtists(data.artists)
      if (data.city && !city) setCity(data.city)
      if (data.description && !description) setDescription(data.description)
      if (data.hero_image && !heroImageUrl) setHeroImageUrl(data.hero_image)
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Failed to scrape')
    } finally {
      setScraping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('hero_image_url', heroImageUrl)
    startTransition(async () => {
      try {
        await addExhibition(formData)
      } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') return
        setSubmitError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <Label>Link to exhibition</Label>
        <div className="flex gap-3 items-stretch">
          <input
            name="link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleScrape}
            disabled={!link || scraping}
            className="text-xs uppercase tracking-widest border border-black px-5 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {scraping ? 'Fetching…' : 'Auto-fill'}
          </button>
        </div>
        {scrapeError ? (
          <div className="mt-2 text-sm text-red-700">{scrapeError}</div>
        ) : null}
      </section>

      <Field label="Title *" required>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
        />
      </Field>

      <div className="grid md:grid-cols-2 gap-x-8 gap-y-10">
        <Field label="Museum / Gallery">
          <input
            name="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Artist(s)">
          <input
            name="artists"
            value={artists}
            onChange={(e) => setArtists(e.target.value)}
            placeholder="Comma separated"
            className={inputCls}
          />
        </Field>

        <Field label="City">
          <input
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Date visited *">
          <input
            name="date_visited"
            type="date"
            required
            value={dateVisited}
            onChange={(e) => setDateVisited(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Hero image">
        {heroImageUrl ? (
          <div className="mb-2 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl}
              alt=""
              className="w-32 h-24 object-cover bg-neutral-100"
            />
            <button
              type="button"
              onClick={() => setHeroImageUrl('')}
              className="text-xs uppercase tracking-widest underline underline-offset-4"
            >
              Remove
            </button>
          </div>
        ) : null}
        <input
          name="hero_image_file"
          type="file"
          accept="image/*"
          className="text-sm"
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={textareaCls}
        />
      </Field>

      <Field label="My notes">
        <textarea
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={textareaCls}
        />
      </Field>

      <Field label="My photos">
        <input
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="text-sm"
        />
      </Field>

      {submitError ? (
        <div className="text-sm text-red-700">{submitError}</div>
      ) : null}

      <div className="flex justify-end gap-4 pt-6 border-t border-black">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs uppercase tracking-widest border border-black px-8 py-3 hover:bg-black hover:text-white transition-colors disabled:opacity-40"
        >
          {isPending ? 'Saving…' : 'Save exhibition'}
        </button>
      </div>
    </form>
  )
}

const inputCls =
  'w-full bg-transparent border-b border-black py-2 text-lg font-light focus:outline-none focus:border-b-2'
const textareaCls =
  'w-full bg-transparent border border-black py-2 px-3 text-base font-light focus:outline-none resize-y'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {children}
    </label>
  )
}
