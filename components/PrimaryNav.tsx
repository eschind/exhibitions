'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Visited' },
  { href: '/wishlist', label: 'Wishlist' },
]

export default function PrimaryNav() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-6">
      {tabs.map((t) => {
        const active =
          t.href === '/'
            ? pathname === '/' || pathname.startsWith('/exhibition/')
            : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              'text-xs uppercase tracking-widest pb-1 ' +
              (active
                ? 'border-b-2 border-black text-black'
                : 'text-neutral-500 hover:text-black')
            }
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
