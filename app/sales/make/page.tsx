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
    <div className="w-full px-2 sm:px-4 py-2 space-y-2">
      <div className="flex items-center justify-between gap-4 max-w-[1400px] mx-auto px-1">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">Make Sale</h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            POS terminal — select group, add items, pay
          </p>
        </div>
        <Link
          href="/sales/pos"
          className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          ← Back
        </Link>
      </div>

      {loadError ? (
        <div className="max-w-xl mx-auto rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm space-y-2">
          <p className="font-medium">Unable to load products</p>
          <p className="text-red-300/90 text-xs">{loadError}</p>
          <p className="text-red-300/70 text-xs">
            Please try again or contact your system administrator.
          </p>
        </div>
      ) : (
        <MakeSaleForm products={products} chart={chart} />
      )}
    </div>
  )
}
