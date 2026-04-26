import Link from 'next/link'
import { listExhibitions } from '@/lib/db'
import { requireUserId } from '@/lib/session'
import WishlistClient from '@/components/WishlistClient'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const userId = await requireUserId()
  const items = await listExhibitions(userId, 'wishlist')

  return (
    <section>
      <div className="flex items-end justify-between mb-8 pb-3 border-b border-black gap-4">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight">
          Wishlist
        </h1>
        <Link
          href="/new"
          className="text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Add to wishlist
        </Link>
      </div>
      <WishlistClient exhibitions={items} />
    </section>
  )
}
