import { listExhibitions } from '@/lib/db'
import { requireUserId } from '@/lib/session'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const userId = await requireUserId()
  const exhibitions = await listExhibitions(userId)
  return <HomeClient exhibitions={exhibitions} />
}
