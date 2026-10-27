import { getLogoUrl } from '@/app/actions/settings'
import HomeClient from '@/app/components/HomeClient'

export default async function Home() {
  const logoUrl = await getLogoUrl()
  return <HomeClient logoUrl={logoUrl} />
}
