import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { logoutSales } from '@/app/actions/auth'

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
  if (isAdmin) {
    redirect('/login')
  }

  const isSales =
    metaRole === 'sales' ||
    dbRole === 'user' ||
    (!metaRole && !dbRole)

  if (!isSales) {
    redirect('/login')
  }

  const staffLabel =
    (user.user_metadata?.staff_id as string) ||
    user.email?.split('@')[0]?.toUpperCase() ||
    'Sales'

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30 backdrop-blur-md shrink-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/sales/pos" className="font-semibold text-white hover:text-emerald-300 shrink-0">
              Sales Terminal
            </Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link
                href="/sales/make"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Make Sale
              </Link>
              <Link
                href="/sales/report"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                Report
              </Link>
            </nav>
            <span className="text-xs text-slate-500 truncate">{staffLabel}</span>
          </div>
          <form action={logoutSales}>
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 flex flex-col min-h-0 pb-0 md:pb-2">{children}</div>
    </div>
  )
}
