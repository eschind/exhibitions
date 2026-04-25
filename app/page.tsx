import { listExhibitions } from '@/lib/db'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const exhibitions = await listExhibitions()
  return <HomeClient exhibitions={exhibitions} />
}
