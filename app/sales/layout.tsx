import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logoutSales } from '@/app/actions/auth'

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
  } catch (e) {
    console.error('[sales layout] auth', e)
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  const staffLabel =
    (user.user_metadata?.staff_id as string) ||
    user.email?.split('@')[0]?.toUpperCase() ||
    'Sales'

  return (
    <div className="flex flex-col min-h-[100dvh] h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100">
      {/* Mobile top bar — always visible on phone */}
      <header className="md:hidden shrink-0 border-b border-slate-800 bg-slate-900 z-30 text-[15px]">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <Link href="/sales/pos" className="font-semibold text-white text-sm truncate">
            Sales
          </Link>
          <nav className="flex items-center gap-1 text-xs">
            <Link
              href="/sales/make"
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium"
            >
              Make Sale
            </Link>
            <Link
              href="/sales/report"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200"
            >
              Report
            </Link>
            <form action={logoutSales}>
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg text-slate-400"
              >
                Out
              </button>
            </form>
          </nav>
        </div>
        <p className="px-3 pb-1.5 text-[10px] text-slate-500 truncate">{staffLabel}</p>
      </header>

      {/* Desktop header */}
      <header className="hidden md:block border-b border-slate-800 bg-slate-900/95 shrink-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link
              href="/sales/pos"
              className="font-semibold text-white hover:text-emerald-300 shrink-0"
            >
              Sales Terminal
            </Link>
            <nav className="flex items-center gap-1 text-sm">
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

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
        {children}
      </div>
    </div>
  )
}
