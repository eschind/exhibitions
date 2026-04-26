import { signIn, auth } from '@/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user?.id) redirect('/')

  async function signInWithGoogle() {
    'use server'
    await signIn('google', { redirectTo: '/' })
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-sm w-full text-center space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">Exhibitions</h1>
          <p className="text-sm text-neutral-500">
            Sign in to see and add your exhibitions.
          </p>
        </div>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full border border-black px-6 py-3 text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  )
}
