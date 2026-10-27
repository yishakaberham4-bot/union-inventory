import Link from 'next/link'
import { logoutSales } from '@/app/actions/auth'

export default function SalesPosPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto p-6 space-y-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between md:justify-center gap-3">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-2xl font-bold text-white">Sales Terminal</h1>
            <p className="text-slate-400 text-sm">Choose an action below</p>
          </div>
          <form action={logoutSales} className="md:hidden shrink-0">
            <button
              type="submit"
              className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/sales/make"
            className="group rounded-2xl border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/50 p-8 text-center transition shadow-lg shadow-emerald-950/30"
          >
            <div className="text-4xl mb-3">🛒</div>
            <h2 className="text-xl font-semibold text-emerald-300 group-hover:text-emerald-200">
              Make Sale
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Select product, quantity &amp; complete a sale
            </p>
          </Link>

          <Link
            href="/sales/report"
            className="group rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 p-8 text-center transition"
          >
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-white group-hover:text-slate-100">
              Show Report
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              View recent sales history
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
