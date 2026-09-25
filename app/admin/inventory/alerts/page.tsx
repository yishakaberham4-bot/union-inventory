import Link from 'next/link'
import { getLowStockProducts, getProducts } from '@/app/actions/products'
import { ThresholdRow } from './threshold-row'

export default async function AlertsPage() {
  let low: Awaited<ReturnType<typeof getLowStockProducts>> = []
  let all: Awaited<ReturnType<typeof getProducts>> = []
  let errorMsg: string | null = null

  try {
    ;[low, all] = await Promise.all([getLowStockProducts(), getProducts()])
  } catch (err: any) {
    errorMsg = err.message || 'Failed to load products'
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/admin/inventory" className="text-slate-400 hover:text-white text-sm">
            ← Inventory
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">Low stock alerts</h1>
          <p className="text-slate-400 text-sm">
            Products at or below their low-stock threshold. Adjust thresholds below.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Alert list */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Currently low</h2>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                low.length > 0
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {low.length} alert{low.length !== 1 ? 's' : ''}
            </span>
          </div>
          {low.length === 0 && !errorMsg ? (
            <p className="px-6 py-10 text-center text-slate-500 text-sm">
              All products are above their low-stock thresholds.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {low.map((p) => (
                <li
                  key={p.id}
                  className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-slate-800/40"
                >
                  <div>
                    <div className="text-white font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-bold">{p.stock_qty} in stock</div>
                    <div className="text-xs text-slate-500">
                      threshold: {p.low_stock_threshold}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Configure thresholds */}
        <div>
          <h2 className="font-semibold text-white mb-3">Set low stock thresholds</h2>
          <div className="space-y-3">
            {all.map((p) => (
              <ThresholdRow key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
