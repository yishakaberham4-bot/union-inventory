import Link from 'next/link'
import {
  getAvailableProductsForSale,
  getSalesChartSummary,
} from '@/app/actions/sales'
import MakeSaleForm from './make-sale-form'

export const dynamic = 'force-dynamic'

export default async function MakeSalePage() {
  let products: Awaited<ReturnType<typeof getAvailableProductsForSale>> = []
  let loadError: string | null = null
  let chart = {
    days: [] as {
      date: string
      label: string
      revenue: number
      count: number
    }[],
    todayRevenue: 0,
    todayCount: 0,
    weekRevenue: 0,
    weekCount: 0,
  }

  try {
    products = await getAvailableProductsForSale()
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load products'
    console.error('[MakeSalePage] products', loadError)
  }

  try {
    chart = await getSalesChartSummary(7)
  } catch (e) {
    console.error('[MakeSalePage] chart', e)
  }

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden relative bg-white text-black">
      <div className="md:hidden shrink-0 px-3 py-2 border-b border-slate-200 flex items-center justify-between bg-white">
        <Link href="/sales/pos" className="text-sm text-slate-600">
          ← Terminal
        </Link>
        <span className="text-sm font-semibold text-slate-900">Make Sale</span>
        <span className="w-16" />
      </div>

      {loadError ? (
        <div className="m-4 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900 text-sm space-y-3 max-w-lg">
          <p className="font-semibold text-base">Unable to load products</p>
          <p className="text-xs font-mono break-all text-red-700">{loadError}</p>
          <p className="text-xs text-red-800">
            Vercel → Settings → Environment Variables → set{' '}
            <code className="bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> →
            Redeploy. Also ensure products have stock &gt; 0.
          </p>
          <Link
            href="/sales/pos"
            className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
          >
            ← Back to terminal
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="m-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 text-sm space-y-2 max-w-lg">
          <p className="font-semibold">No products available for sale</p>
          <p className="text-xs">
            Add products in Admin → Inventory and set stock quantity greater than
            0.
          </p>
          <Link href="/sales/pos" className="text-sm text-amber-800 underline">
            ← Terminal
          </Link>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
          <MakeSaleForm products={products} chart={chart} />
        </div>
      )}
    </div>
  )
}
