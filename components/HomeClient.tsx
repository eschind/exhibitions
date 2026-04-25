'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Exhibition } from '@/lib/db'
import { formatDateShort, quarterOf, splitArtists } from '@/lib/format'
import ExhibitionMenu from './ExhibitionMenu'

const PAGE_SIZE = 9

type Props = { exhibitions: Exhibition[] }

export default function HomeClient({ exhibitions }: Props) {
  const [search, setSearch] = useState('')
  const [artist, setArtist] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [quarter, setQuarter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const artistOptions = useMemo(() => {
    const s = new Set<string>()
    exhibitions.forEach((e) => splitArtists(e.artists).forEach((a) => s.add(a)))
    return Array.from(s).sort()
  }, [exhibitions])

  const venueOptions = useMemo(() => {
    const s = new Set<string>()
    exhibitions.forEach((e) => e.venue && s.add(e.venue))
    return Array.from(s).sort()
  }, [exhibitions])

  const cityOptions = useMemo(() => {
    const s = new Set<string>()
    exhibitions.forEach((e) => e.city && s.add(e.city))
    return Array.from(s).sort()
  }, [exhibitions])

  const quarterOptions = useMemo(() => {
    const s = new Set<string>()
    exhibitions.forEach((e) => {
      const q = quarterOf(e.date_visited)
      if (q) s.add(q)
    })
    return Array.from(s).sort().reverse()
  }, [exhibitions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exhibitions.filter((e) => {
      if (artist && !splitArtists(e.artists).includes(artist)) return false
      if (venue && e.venue !== venue) return false
      if (city && e.city !== city) return false
      if (quarter && quarterOf(e.date_visited) !== quarter) return false
      if (q) {
        const hay = [e.title, e.venue, e.artists, e.city, e.description, e.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [exhibitions, search, artist, venue, city, quarter])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, artist, venue, city, quarter])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
        }
      },
      { rootMargin: '400px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [filtered.length])

  const visible = filtered.slice(0, visibleCount)

  const clearFilters = () => {
    setSearch('')
    setArtist('')
    setVenue('')
    setCity('')
    setQuarter('')
  }

  const hasFilters = search || artist || venue || city || quarter

  return (
    <div>
      <div className="mb-12 border-b border-black pb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exhibitions"
          className="w-full bg-transparent text-2xl md:text-3xl font-light placeholder:text-neutral-400 focus:outline-none py-2"
        />
      </div>

      <div className="mb-10 flex flex-wrap gap-x-8 gap-y-4 items-end text-xs uppercase tracking-widest">
        <FilterSelect
          label="Artist"
          value={artist}
          onChange={setArtist}
          options={artistOptions}
        />
        <FilterSelect
          label="Venue"
          value={venue}
          onChange={setVenue}
          options={venueOptions}
        />
        <FilterSelect
          label="City"
          value={city}
          onChange={setCity}
          options={cityOptions}
        />
        <FilterSelect
          label="Date visited"
          value={quarter}
          onChange={setQuarter}
          options={quarterOptions}
        />
        {hasFilters ? (
          <button
            onClick={clearFilters}
            className="underline underline-offset-4 hover:no-underline"
          >
            Clear
          </button>
        ) : null}
        <div className="ml-auto text-neutral-500 normal-case tracking-normal text-sm">
          {filtered.length} {filtered.length === 1 ? 'exhibition' : 'exhibitions'}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-32 text-center text-neutral-400 text-lg">
          No exhibitions match.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {visible.map((e) => (
            <Card key={e.id} e={e} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-neutral-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-black py-1 pr-6 normal-case tracking-normal text-sm focus:outline-none cursor-pointer"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

function Card({ e }: { e: Exhibition }) {
  const dateStr = formatDateShort(e.date_visited)
  return (
    <Link href={`/exhibition/${e.id}`} className="group block relative">
      <div className="aspect-[4/3] bg-neutral-100 overflow-hidden mb-4">
        {e.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.hero_image}
            alt={e.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs uppercase tracking-widest">
            No image
          </div>
        )}
      </div>
      <div className="relative space-y-1 pr-8">
        <div className="absolute top-0 right-0">
          <ExhibitionMenu id={e.id} title={e.title} variant="card" />
        </div>
        {dateStr ? (
          <div className="text-xs uppercase tracking-widest text-neutral-500">
            {dateStr}
          </div>
        ) : null}
        <h2 className="text-xl md:text-2xl font-light leading-tight group-hover:underline underline-offset-4">
          {e.title}
        </h2>
        {e.artists ? (
          <div className="text-sm text-neutral-700">{e.artists}</div>
        ) : null}
        <div className="text-sm text-neutral-500">
          {[e.venue, e.city].filter(Boolean).join(' · ')}
        </div>
      </div>
    </Link>
  )
}
