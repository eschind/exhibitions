import Link from 'next/link'
import { listExhibitions, getPreferences, hasPreferences } from '@/lib/db'
import { requireUserId } from '@/lib/session'
import WishlistClient from '@/components/WishlistClient'
import PreferencesForm from '@/components/PreferencesForm'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const userId = await requireUserId()
  const [items, prefs, onboarded] = await Promise.all([
    listExhibitions(userId, 'wishlist'),
    getPreferences(userId),
    hasPreferences(userId),
  ])

  if (!onboarded) {
    return (
      <div className="max-w-2xl">
        <PreferencesForm initial={prefs} mode="onboarding" />
      </div>
    )
  }

  return (
    <div className="space-y-16">
      <section>
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-black gap-4">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight">
            Your wishlist
          </h1>
          <Link
            href="/wishlist/preferences"
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
          >
            Edit preferences
          </Link>
        </div>
        <WishlistClient exhibitions={items} />
      </section>

      <section>
        <div className="flex items-end justify-between mb-8 pb-3 border-b border-black">
          <h2 className="text-2xl md:text-3xl font-light tracking-tight">
            Discover
          </h2>
        </div>
        <div className="py-12 border border-dashed border-neutral-300 text-center">
          <p className="text-lg font-light mb-2">
            Personalized exhibition discovery is coming soon.
          </p>
          <p className="text-sm text-neutral-500 mb-1">
            We&apos;ll surface upcoming shows matching the artists, cities, and
            venues you follow.
          </p>
          <p className="text-sm text-neutral-500">
            Until then, add exhibitions to your wishlist manually.
          </p>
          <div className="mt-6">
            <Link
              href="/new"
              className="inline-block text-xs uppercase tracking-widest border border-black px-5 py-2 hover:bg-black hover:text-white transition-colors"
            >
              Add to wishlist
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
