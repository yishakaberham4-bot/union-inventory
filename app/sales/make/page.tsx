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
    <div className="w-full flex flex-col flex-1 min-h-0 md:px-4 md:py-3 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 md:bg-none">
      <div className="hidden md:flex items-center justify-between gap-4 max-w-[1400px] mx-auto px-1 w-full mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight drop-shadow">
            Make Sale
          </h1>
          <p className="text-sm text-slate-400">
            POS terminal — select group, add items, pay
          </p>
        </div>
        <Link
          href="/sales/pos"
          className="text-sm px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-100 transition shadow-lg"
        >
          ← Back
        </Link>
      </div>

      {/* Mobile: header is inside the form */}
      <div className="md:hidden h-0 overflow-hidden" aria-hidden />

      {loadError ? (
        <div className="max-w-xl mx-auto m-4 rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm space-y-2">
          <p className="font-medium">Unable to load products</p>
          <p className="text-red-300/90 text-xs">{loadError}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <MakeSaleForm products={products} chart={chart} />
        </div>
      )}
    </div>
  )
}
