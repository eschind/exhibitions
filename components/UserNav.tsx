import Link from 'next/link'
import { auth, signOut } from '@/auth'

export default async function UserNav() {
  const session = await auth()
  if (!session?.user?.id) return null

  async function doSignOut() {
    'use server'
    await signOut({ redirectTo: '/login' })
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/profile"
        className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
      >
        {session.user.name || session.user.email}
      </Link>
      <form action={doSignOut}>
        <button
          type="submit"
          className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
