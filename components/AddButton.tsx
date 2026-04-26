'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AddButton() {
  const pathname = usePathname()
  const isWishlist = pathname.startsWith('/wishlist')
  const href = isWishlist ? '/new?status=wishlist' : '/new'
  const label = isWishlist ? 'Add to wishlist' : 'Add visited'
  return (
    <Link
      href={href}
      className="text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
    >
      {label}
    </Link>
  )
}
