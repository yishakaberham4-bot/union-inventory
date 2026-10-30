import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SalesDesktopNav, SalesMobileBar } from './SalesChrome'

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    redirect('/login')
  }

  if (!user) redirect('/login')

  const staffLabel =
    (user.user_metadata?.staff_id as string) ||
    user.email?.split('@')[0]?.toUpperCase() ||
    'Sales'

  return (
    <div className="flex flex-col min-h-[100dvh] h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100">
      <SalesMobileBar staffLabel={staffLabel} />
      <SalesDesktopNav staffLabel={staffLabel} />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">{children}</div>
    </div>
  )
}
