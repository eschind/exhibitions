import Link from 'next/link'
import { getPreferences } from '@/lib/db'
import { requireUserId } from '@/lib/session'
import PreferencesForm from '@/components/PreferencesForm'

export const dynamic = 'force-dynamic'

export default async function PreferencesPage() {
  const userId = await requireUserId()
  const prefs = await getPreferences(userId)

  return (
    <article className="max-w-2xl">
      <Link
        href="/wishlist"
        className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black mb-8 inline-block"
      >
        ← Back to wishlist
      </Link>
      <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-10">
        Preferences
      </h1>
      <PreferencesForm initial={prefs} mode="edit" />
    </article>
  )
}
