import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from './admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  const metaRole = (user.user_metadata?.role as string) || ''
  let dbRole = ''
  try {
    const { data: row } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    dbRole = row?.role || ''
  } catch {
    // ignore
  }

  const isAdmin = metaRole === 'admin' || dbRole === 'admin'
  if (!isAdmin) {
    redirect('/admin-login')
  }

  const staffLabel =
    (user.user_metadata?.staff_id as string) ||
    user.email?.split('@')[0]?.toUpperCase() ||
    'Admin'

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100">
      <AdminSidebar staffLabel={staffLabel} />
      <main className="flex-1 min-w-0 overflow-x-auto pb-2">{children}</main>
    </div>
  )
}
