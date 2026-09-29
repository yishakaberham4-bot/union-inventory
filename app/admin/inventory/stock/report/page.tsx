import Link from 'next/link'
import { Suspense } from 'react'
import { getStockMovements, type StockMovement } from '@/app/actions/products'
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

function modeLabel(mode: string) {
  switch (mode) {
    case 'add':
      return 'Added'
    case 'remove':
      return 'Removed'
    case 'set':
      return 'Set'
    case 'initial':
      return 'Initial'
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
  const modeFilter = (sp.mode || 'add').toLowerCase() // default: added stock

  let rows: StockMovement[] = []
  let error: string | null = null

  if (hasRange) {
    try {
      rows = await getStockMovements({
        from: sp.from || null,
        to: sp.to || null,
        mode: modeFilter === 'all' ? null : modeFilter,
        limit: 5000,
      })
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load stock report'
    }
  }

  const totalAdded = rows
    .filter((r) => r.mode === 'add' || r.mode === 'initial')
    .reduce((s, r) => s + r.amount, 0)
  const totalRemoved = rows
    .filter((r) => r.mode === 'remove')
    .reduce((s, r) => s + r.amount, 0)
  const net = totalAdded - totalRemoved

  // Group by product for summary
  const byProduct = new Map<
    string,
    { name: string; sku: string; added: number; removed: number; count: number }
  >()
  for (const r of rows) {
    const key = r.product_id || r.product_sku || r.product_name
    const cur = byProduct.get(key) || {
      name: r.product_name,
      sku: r.product_sku,
      added: 0,
      removed: 0,
      count: 0,
    }
    if (r.mode === 'add' || r.mode === 'initial') cur.added += r.amount
    if (r.mode === 'remove') cur.removed += r.amount
    cur.count += 1
    byProduct.set(key, cur)
  }
  const productSummary = Array.from(byProduct.values()).sort(
    (a, b) => b.added - a.added
  )

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
            Added stock and adjustments by day, month, or custom date range
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
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">Could not load stock report</p>
            <p className="text-amber-200/80 mt-1 text-xs whitespace-pre-wrap">
              {error}
            </p>
          </div>
        )}

        {!hasRange && !error && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-10 text-center text-slate-500 text-sm">
            Choose a date range (or use This month / Today) and click{' '}
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
                {modeFilter !== 'all' && (
                  <>
                    {' '}
                    · Mode:{' '}
                    <span className="text-white font-medium">
                      {modeLabel(modeFilter)}
                    </span>
                  </>
                )}
              </p>
              <p className="text-slate-500">{rows.length} movements</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Movements</p>
                <p className="text-xl font-semibold text-white mt-0.5">
                  {rows.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Units added</p>
                <p className="text-xl font-semibold text-emerald-400 mt-0.5">
                  +{totalAdded.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Units removed</p>
                <p className="text-xl font-semibold text-red-400 mt-0.5">
                  −{totalRemoved.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <p className="text-xs text-slate-500">Net change</p>
                <p
                  className={`text-xl font-semibold mt-0.5 ${
                    net >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {net >= 0 ? '+' : ''}
                  {net.toLocaleString()}
                </p>
              </div>
            </div>

            {productSummary.length > 0 && (
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                  <h2 className="text-sm font-semibold text-white">
                    By product
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/60 text-slate-400 text-left">
                      <tr>
                        <th className="px-4 py-2 font-medium">Product</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Added
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Removed
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Entries
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {productSummary.map((p) => (
                        <tr
                          key={p.sku + p.name}
                          className="hover:bg-slate-900/40"
                        >
                          <td className="px-4 py-2 text-white">
                            {p.name}
                            {p.sku && (
                              <span className="text-slate-500 text-xs ml-1.5">
                                {p.sku}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-emerald-400">
                            +{p.added}
                          </td>
                          <td className="px-4 py-2 text-right text-red-400">
                            {p.removed > 0 ? `−${p.removed}` : '—'}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-400">
                            {p.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-950/90 border-t-2 border-slate-700">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-white">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                          +{totalAdded}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-400">
                          {totalRemoved > 0 ? `−${totalRemoved}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-300">
                          {rows.length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                <h2 className="text-sm font-semibold text-white">
                  Movement detail
                </h2>
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
                    {rows.map((r) => (
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
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          No stock movements in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
