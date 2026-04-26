import Link from 'next/link'
import { listExhibitions } from '@/lib/db'
import { requireUserId } from '@/lib/session'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const userId = await requireUserId()
  const exhibitions = await listExhibitions(userId)
  return (
    <section>
      <div className="flex items-end justify-between mb-8 pb-3 border-b border-black gap-4">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight">
          Visited
        </h1>
        <Link
          href="/new"
          className="text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Add visited
        </Link>
      </div>
      <HomeClient exhibitions={exhibitions} />
    </section>
  )
}
