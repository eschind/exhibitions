'use client'

import Link from 'next/link'
import type { Exhibition } from '@/lib/db'
import ExhibitionMenu from './ExhibitionMenu'
import MarkVisitedDialog from './MarkVisitedDialog'

export default function WishlistClient({
  exhibitions,
}: {
  exhibitions: Exhibition[]
}) {
  if (exhibitions.length === 0) {
    return (
      <div className="py-16 border border-dashed border-neutral-300 text-center">
        <p className="text-lg font-light mb-4">Your wishlist is empty.</p>
        <p className="text-sm text-neutral-500 mb-6">
          Add exhibitions you want to visit. We&apos;ll keep them here until
          you&apos;ve been.
        </p>
        <Link
          href="/new?status=wishlist"
          className="inline-block text-xs uppercase tracking-widest border border-black px-5 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Add to wishlist
        </Link>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
      {exhibitions.map((e) => (
        <Card key={e.id} e={e} />
      ))}
    </div>
  )
}

function Card({ e }: { e: Exhibition }) {
  return (
    <div className="group block relative">
      <Link href={`/exhibition/${e.id}`} className="block">
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
      <div className="mt-3">
        <MarkVisitedDialog id={e.id} title={e.title} />
      </div>
    </div>
  )
}
