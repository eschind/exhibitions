import { requireUserId } from '@/lib/session'
import { getUserById, listExhibitions } from '@/lib/db'
import { signOut } from '@/auth'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const userId = await requireUserId()
  const [user, exhibitions] = await Promise.all([
    getUserById(userId),
    listExhibitions(userId),
  ])
  if (!user) notFound()

  async function doSignOut() {
    'use server'
    await signOut({ redirectTo: '/login' })
  }

  return (
    <article className="max-w-2xl">
      <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-8">
        Profile
      </h1>

      <div className="flex items-center gap-6 mb-12 pb-8 border-b border-black">
        {user.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.image}
            alt=""
            className="w-20 h-20 rounded-full bg-neutral-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-neutral-100" />
        )}
        <div>
          <div className="text-xl font-light">{user.name || user.email}</div>
          <div className="text-sm text-neutral-500">{user.email}</div>
        </div>
      </div>

      <dl className="space-y-4 text-sm">
        <div className="flex justify-between border-b border-neutral-200 pb-3">
          <dt className="uppercase tracking-widest text-neutral-500">
            Exhibitions logged
          </dt>
          <dd>{exhibitions.length}</dd>
        </div>
        <div className="flex justify-between border-b border-neutral-200 pb-3">
          <dt className="uppercase tracking-widest text-neutral-500">
            Member since
          </dt>
          <dd>
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : '—'}
          </dd>
        </div>
      </dl>

      <form action={doSignOut} className="mt-12">
        <button
          type="submit"
          className="text-xs uppercase tracking-widest border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Sign out
        </button>
      </form>
    </article>
  )
}
