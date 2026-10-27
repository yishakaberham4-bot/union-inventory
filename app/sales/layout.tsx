import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  const staffLabel =
    (user.user_metadata?.staff_id as string) ||
    user.email?.split('@')[0]?.toUpperCase() ||
    'Sales'

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden bg-slate-950 text-slate-100">
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

      {/* Full remaining height for POS / make sale on phone */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
        {children}
      </div>
    </div>
  )
}
