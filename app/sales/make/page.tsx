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
    <div className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden relative bg-white md:bg-transparent">
      {/* Desktop-only title row */}
      <div className="hidden md:flex items-center justify-between gap-4 max-w-[1400px] mx-auto px-4 w-full mb-3 pt-2 shrink-0">
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
      </div>

      {loadError ? (
        <div className="max-w-xl mx-auto m-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 text-sm space-y-2">
          <p className="font-semibold">Unable to load products</p>
          <p className="text-red-600/90 text-xs">{loadError}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
          <MakeSaleForm products={products} chart={chart} />
        </div>
      )}
    </div>
  )
}
