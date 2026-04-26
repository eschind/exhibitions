import Link from 'next/link'
import NewExhibitionForm from '@/components/NewExhibitionForm'

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const isWishlist = status === 'wishlist'
  return (
    <div className="max-w-3xl">
      <Link
        href={isWishlist ? '/wishlist' : '/'}
        className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
      >
        ← {isWishlist ? 'Wishlist' : 'All exhibitions'}
      </Link>
      <h1 className="text-4xl md:text-5xl font-light tracking-tight mt-6 mb-12 pb-6 border-b border-black">
        {isWishlist ? 'Add to wishlist' : 'Add new exhibition'}
      </h1>
      <NewExhibitionForm defaultStatus={isWishlist ? 'wishlist' : 'visited'} />
    </div>
  )
}
