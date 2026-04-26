import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export async function requireUserId(): Promise<number> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) redirect('/login')
  return Number(id)
}
