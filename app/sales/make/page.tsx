import Link from 'next/link'
import {
  getAvailableProductsForSale,
  getSalesChartSummary,
} from '@/app/actions/sales'
import MakeSaleForm from './make-sale-form'

export default async function MakeSalePage() {
  let products: Awaited<ReturnType<typeof getAvailableProductsForSale>> = []
  let loadError: string | null = null
  let chart = {
    days: [] as { date: string; label: string; revenue: number; count: number }[],
    todayRevenue: 0,
    todayCount: 0,
    weekRevenue: 0,
    weekCount: 0,
  }

  try {
    products = await getAvailableProductsForSale()
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load products'
  }

  try {
    chart = await getSalesChartSummary(7)
  } catch {
    // chart optional
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0 relative">
      {/* Desktop ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 hidden md:block"
        aria-hidden
      >
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      {/* ===== DESKTOP HEADER ===== */}
      <div className="hidden md:flex items-center justify-between gap-4 max-w-[1400px] mx-auto px-4 w-full mb-3 pt-2">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-lg shadow-lg shadow-violet-500/30">
            🛒
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Make Sale
            </h1>
            <p className="text-xs text-slate-500">
              POS terminal — select products, build cart, checkout
            </p>
          </div>
        </div>
        <Link
          href="/sales/pos"
          className="
            text-sm px-4 py-2 rounded-xl font-medium
            bg-white border border-slate-200 text-slate-700
            shadow-sm hover:shadow-md hover:border-slate-300
            transition-all active:scale-95
          "
        >
          ← Back to POS
        </Link>
      </div>

      {/* ===== MOBILE HEADER ===== */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3 py-2.5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <Link
          href="/sales/pos"
          className="flex items-center gap-1 text-xs font-medium text-slate-600 active:text-violet-600 py-1.5 px-1"
        >
          <span className="text-base leading-none">‹</span> Back
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🛒</span>
          <span className="text-sm font-bold text-slate-900">Make Sale</span>
        </div>
        <span className="w-12" aria-hidden />
      </div>

      {loadError ? (
        <div className="max-w-xl mx-auto m-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 text-sm space-y-2">
          <p className="font-semibold">Unable to load products</p>
          <p className="text-red-600/90 text-xs">{loadError}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <MakeSaleForm products={products} chart={chart} />
        </div>
      )}
    </div>
  )
}
