import Link from 'next/link'
import { Suspense } from 'react'
import {
  getStockMovements,
  getProductsCreatedInRange,
  type StockMovement,
  type Product,
} from '@/app/actions/products'
import StockReportFilters from './filters'

function formatDate(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso.slice(0, 16)
  }
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function modeLabel(mode: string) {
  switch (mode) {
    case 'add':
      return 'Added to existing'
    case 'remove':
      return 'Removed'
    case 'set':
      return 'Set quantity'
    case 'initial':
      return 'Initial stock'
    default:
      return mode || '—'
  }
}

function modeClass(mode: string) {
  switch (mode) {
    case 'add':
    case 'initial':
      return 'bg-emerald-500/15 text-emerald-400'
    case 'remove':
      return 'bg-red-500/15 text-red-400'
    case 'set':
      return 'bg-blue-500/15 text-blue-400'
    default:
      return 'bg-slate-500/15 text-slate-400'
  }
}

export default async function StockReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    mode?: string
    generated?: string
  }>
}) {
  const sp = await Promise.resolve(searchParams)
  const hasRange = !!(sp.from || sp.to || sp.generated)
  const modeFilter = (sp.mode || 'add').toLowerCase()

  let movements: StockMovement[] = []
  let missingTable = false
  let newProducts: Product[] = []
  let error: string | null = null

  if (hasRange) {
    try {
      newProducts = await getProductsCreatedInRange({
        from: sp.from || null,
        to: sp.to || null,
      })

      const mov = await getStockMovements({
        from: sp.from || null,
        to: sp.to || null,
        mode: modeFilter === 'all' ? null : modeFilter,
        limit: 5000,
      })
      movements = mov.rows
      missingTable = mov.missingTable
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load stock report'
    }
  }

  const removedMoves = movements.filter((r) => r.mode === 'remove')
  const totalRemoved = removedMoves.reduce((s, r) => s + r.amount, 0)
  const totalInitialFromNewProducts = newProducts.reduce(
    (s, p) => s + (p.stock_qty || 0),
    0
  )
  const existingAdds = movements.filter((r) => r.mode === 'add')
  const totalAddedToExisting = existingAdds.reduce((s, r) => s + r.amount, 0)

  const rangeLabel =
    sp.from && sp.to
      ? sp.from === sp.to
        ? sp.from
        : `${sp.from} → ${sp.to}`
      : sp.from
        ? `From ${sp.from}`
        : sp.to
          ? `Until ${sp.to}`
          : 'All time'

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link
            href="/admin/inventory/stock"
            className="text-slate-400 hover:text-white text-sm"
          >
            ← Adjust stock
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">Stock report</h1>
          <p className="text-slate-400 text-sm">
            New products and stock added to existing products by day, month, or
            date range
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-slate-500 text-sm">Loading filters…</div>
          }
        >
          <StockReportFilters />
        </Suspense>

        {error && (
          <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {missingTable && hasRange && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 space-y-2">
            <p className="font-medium">
              Optional: enable full stock history (add/remove on existing products)
            </p>
            <p className="text-amber-200/80 text-xs">
              New products by date already work below. To also track stock you{' '}
              <strong>add later</strong> to existing products, run this once in{' '}
              <strong>Supabase → SQL Editor</strong>:
            </p>
            <pre className="text-[11px] bg-slate-950/80 border border-slate-800 rounded-lg p-3 overflow-x-auto text-slate-300 whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  product_name text,
  product_sku text,
  mode text NOT NULL,
  amount int NOT NULL DEFAULT 0,
  previous_qty int NOT NULL DEFAULT 0,
  new_qty int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx
  ON stock_movements (created_at DESC);`}
            </pre>
            <p className="text-amber-200/70 text-xs">
              After creating the table, use <strong>Adjust stock → Add</strong> for
              new entries to appear in “Stock added to existing products”.
            </p>
          </div>
        )}

        {!hasRange && !error && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-10 text-center text-slate-500 text-sm">
            Choose a date range (Today / This month / custom) and click{' '}
            <span className="text-emerald-400 font-medium">Generate report</span>
            .
          </div>
        )}

        {hasRange && !error && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-slate-400">
                Period:{' '}
                <span className="text-white font-medium">{rangeLabel}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">New products</p>
                <p className="text-xl font-semibold text-white mt-0.5">
                  {newProducts.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Initial stock (new)</p>
                <p className="text-xl font-semibold text-emerald-400 mt-0.5">
                  +{totalInitialFromNewProducts.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Added to existing</p>
                <p className="text-xl font-semibold text-blue-400 mt-0.5">
                  +{totalAddedToExisting.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Removed</p>
                <p className="text-xl font-semibold text-red-400 mt-0.5">
                  −{totalRemoved.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  New products added
                </h2>
                <span className="text-xs text-slate-500">
                  {newProducts.length} products
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/60 text-slate-400 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date added</th>
                      <th className="px-4 py-2 font-medium">SKU</th>
                      <th className="px-4 py-2 font-medium">Product</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Initial stock
                      </th>
                      <th className="px-4 py-2 font-medium text-right">Cost</th>
                      <th className="px-4 py-2 font-medium text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {newProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                          {formatDate(p.created_at || '')}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-emerald-400">
                          {p.sku}
                        </td>
                        <td className="px-4 py-2 text-white">{p.name}</td>
                        <td className="px-4 py-2 text-right text-emerald-400 font-medium">
                          +{p.stock_qty}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-400">
                          {formatMoney(Number(p.cost) || 0)}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-300">
                          {formatMoney(p.price)}
                        </td>
                      </tr>
                    ))}
                    {newProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No new products created in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {newProducts.length > 0 && (
                    <tfoot className="bg-slate-950/90 border-t-2 border-slate-700">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 font-semibold text-white"
                        >
                          Total ({newProducts.length} products)
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                          +{totalInitialFromNewProducts}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Stock added to existing products
                </h2>
                <span className="text-xs text-slate-500">
                  {existingAdds.length} entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/60 text-slate-400 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Product</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium text-right">Qty</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Before → After
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {existingAdds.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-4 py-2 text-white">
                          {r.product_name}
                          {r.product_sku && (
                            <span className="text-slate-500 text-xs ml-1.5">
                              {r.product_sku}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${modeClass(
                              r.mode
                            )}`}
                          >
                            {modeLabel(r.mode)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-emerald-400">
                          +{r.amount}
                        </td>
                        <td className="px-4 py-2 text-right text-slate-400">
                          {r.previous_qty} → {r.new_qty}
                        </td>
                      </tr>
                    ))}
                    {existingAdds.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          {missingTable
                            ? 'Create the stock_movements table (SQL above), then use Adjust stock → Add to record entries.'
                            : 'No stock was added to existing products in this period.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {existingAdds.length > 0 && (
                    <tfoot className="bg-slate-950/90 border-t-2 border-slate-700">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 font-semibold text-white"
                        >
                          Total
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                          +{totalAddedToExisting}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {(modeFilter === 'all' ||
              modeFilter === 'remove' ||
              modeFilter === 'set') &&
              movements.length > 0 && (
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                    <h2 className="text-sm font-semibold text-white">
                      All movements in filter
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-900/60 text-slate-400 text-left">
                        <tr>
                          <th className="px-4 py-2 font-medium">Date</th>
                          <th className="px-4 py-2 font-medium">Product</th>
                          <th className="px-4 py-2 font-medium">Type</th>
                          <th className="px-4 py-2 font-medium text-right">
                            Qty
                          </th>
                          <th className="px-4 py-2 font-medium text-right">
                            Before → After
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {movements.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-900/40">
                            <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                              {formatDate(r.created_at)}
                            </td>
                            <td className="px-4 py-2 text-white">
                              {r.product_name}
                              {r.product_sku && (
                                <span className="text-slate-500 text-xs ml-1.5">
                                  {r.product_sku}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${modeClass(
                                  r.mode
                                )}`}
                              >
                                {modeLabel(r.mode)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-white">
                              {r.mode === 'remove' ? '−' : '+'}
                              {r.amount}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-400">
                              {r.previous_qty} → {r.new_qty}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  )
}
