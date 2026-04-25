import { listExhibitions } from '@/lib/db'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default function Home() {
  const exhibitions = listExhibitions()
  return <HomeClient exhibitions={exhibitions} />
}
