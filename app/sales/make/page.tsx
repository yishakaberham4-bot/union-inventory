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
    <div className="w-full flex flex-col flex-1 min-h-0 md:px-4 md:py-2">
      <div className="hidden md:flex items-center justify-between gap-4 max-w-[1400px] mx-auto px-1 w-full mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900">Make Sale</h1>
          <p className="text-xs text-slate-500">
            POS terminal — select group, add items, pay
          </p>
        </div>
        <Link
          href="/sales/pos"
          className="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
        >
          ← Back
        </Link>
      </div>

      {/* Mobile top link only */}
      <div className="md:hidden flex items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-white">
        <Link href="/sales/pos" className="text-xs text-slate-500 active:text-slate-900 py-1">
          ← Back
        </Link>
        <span className="text-xs text-slate-500">Make Sale</span>
        <span className="w-10" />
      </div>

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
