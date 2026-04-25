import Link from 'next/link'
import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import { getExhibition } from '@/lib/db'
import { formatDate, parsePhotos, splitArtists } from '@/lib/format'
import ExhibitionMenu from '@/components/ExhibitionMenu'
import AddPhotosForm from '@/components/AddPhotosForm'

function wikipediaUrl(name: string): string {
  return `https://en.wikipedia.org/wiki/Special:Search?go=Go&search=${encodeURIComponent(name)}`
}

function ArtistLinks({
  value,
  className,
}: {
  value: string | null
  className?: string
}) {
  const names = splitArtists(value)
  if (names.length === 0) return null
  return (
    <span className={className}>
      {names.map((name, i) => (
        <Fragment key={`${name}-${i}`}>
          {i > 0 ? ', ' : ''}
          <a
            href={wikipediaUrl(name)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:no-underline"
          >
            {name}
          </a>
        </Fragment>
      ))}
    </span>
  )
}

export const dynamic = 'force-dynamic'

export default async function ExhibitionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const e = await getExhibition(Number(id))
  if (!e) notFound()

  const photos = parsePhotos(e.photos)

  return (
    <article>
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
        >
          ← All exhibitions
        </Link>
        <ExhibitionMenu id={e.id} title={e.title} variant="page" />
      </div>

      <header className="mt-8 mb-12 pb-8 border-b border-black flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          {e.date_visited ? (
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
              Visited {formatDate(e.date_visited)}
            </div>
          ) : null}
          <h1 className="text-4xl md:text-6xl font-light leading-[1.05] tracking-tight mb-6">
            {e.title}
          </h1>
          {e.artists ? (
            <div className="text-xl md:text-2xl font-light text-neutral-800 mb-2">
              <ArtistLinks value={e.artists} />
            </div>
          ) : null}
          <div className="text-sm uppercase tracking-widest text-neutral-500">
            {[e.venue, e.city].filter(Boolean).join(' · ')}
          </div>
        </div>
        {e.hero_image ? (
          <div className="shrink-0 w-32 md:w-48 aspect-[4/3] bg-neutral-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.hero_image}
              alt={e.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        <div className="md:col-span-2 space-y-8">
          {e.description ? (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
                About
              </h2>
              <p className="text-lg font-light leading-relaxed whitespace-pre-line">
                {e.description}
              </p>
            </section>
          ) : null}

          {e.notes ? (
            <section>
              <h2 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
                Notes
              </h2>
              <p className="text-lg font-light leading-relaxed whitespace-pre-line">
                {e.notes}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 text-sm">
          <Field label="Title" value={e.title} />
          <Field label="Venue" value={e.venue} />
          {e.artists ? (
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Artist(s)
              </div>
              <ArtistLinks value={e.artists} />
            </div>
          ) : null}
          <Field label="City" value={e.city} />
          <Field label="Date visited" value={formatDate(e.date_visited)} />
          {e.link ? (
            <div>
              <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
                Link
              </div>
              <a
                href={e.link}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 break-all hover:no-underline"
              >
                {e.link}
              </a>
            </div>
          ) : null}
        </aside>
      </div>

      <section>
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-black gap-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            My photos
          </h2>
          <AddPhotosForm id={e.id} />
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((src) => (
              <div key={src} className="bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-neutral-400 py-8">No photos yet.</div>
        )}
      </section>
    </article>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1">
        {label}
      </div>
      <div>{value}</div>
    </div>
  )
}
