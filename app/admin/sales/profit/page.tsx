import Link from 'next/link'
import { Suspense } from 'react'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'
import ReportFilters from '../report-filters'
import { parseDateRange } from '../report-utils'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcProfit(sales: SaleRow[]) {
  const revenue = sales.reduce((s, r) => s + (r.total_amount || 0), 0)
  const cost = sales.reduce((s, r) => s + (r.unit_cost || 0) * (r.quantity || 0), 0)
  const qty = sales.reduce((s, r) => s + (r.quantity || 0), 0)
  const profit = revenue - cost
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0
  return { revenue, cost, qty, profit, margin, count: sales.length }
}

export default async function AdminProfitReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string; generated?: string }>
}) {
  const sp = await Promise.resolve(searchParams)
  const productQ = (sp.q || '').trim().toLowerCase()
  const { from, to, label } = parseDateRange(sp)
  const hasRange = !!(sp.from || sp.to)

  let sales: SaleRow[] = []
  let error: string | null = null

  try {
    sales = await getSalesReport({ limit: 5000, from, to })
    if (productQ) {
      sales = sales.filter(
        (s) =>
          s.product_name.toLowerCase().includes(productQ) ||
          (s.product_sku || '').toLowerCase().includes(productQ)
      )
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load profit data'
  }

  const selected = calcProfit(sales)

  type ProductAgg = {
    name: string
    sku: string
    qty: number
    revenue: number
    cost: number
    profit: number
  }
  const byProduct = new Map<string, ProductAgg>()
  for (const s of sales) {
    const key = s.product_id || s.product_sku || s.product_name
    const existing = byProduct.get(key) || {
      name: s.product_name,
      sku: s.product_sku,
      qty: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
    }
    const lineCost = (s.unit_cost || 0) * (s.quantity || 0)
    const lineRev = s.total_amount || 0
    existing.qty += s.quantity || 0
    existing.revenue += lineRev
    existing.cost += lineCost
    existing.profit += lineRev - lineCost
    byProduct.set(key, existing)
  }
  const rows = Array.from(byProduct.values()).sort((a, b) => b.profit - a.profit)

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
          ← Sales & Analysis
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-white mt-1">Profit report</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {hasRange ? label : 'Select date range and generate profit report'}
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-500 text-sm">Loading filters…</div>}>
        <ReportFilters options={{ showProductSearch: true }} />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Summary cards — 2 cols on mobile, 5 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[11px] sm:text-xs text-slate-500">Sales</p>
          <p className="text-lg sm:text-xl font-semibold text-white mt-0.5">{selected.count}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[11px] sm:text-xs text-slate-500">Units</p>
          <p className="text-lg sm:text-xl font-semibold text-white mt-0.5">{selected.qty}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[11px] sm:text-xs text-slate-500">Revenue</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-400 mt-0.5 truncate">
            {formatMoney(selected.revenue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 sm:px-4 py-2.5 sm:py-3">
          <p className="text-[11px] sm:text-xs text-slate-500">Cost</p>
          <p className="text-lg sm:text-xl font-semibold text-slate-200 mt-0.5 truncate">
            {formatMoney(selected.cost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 sm:px-4 py-2.5 sm:py-3 col-span-2 sm:col-span-1">
          <p className="text-[11px] sm:text-xs text-slate-500">Profit</p>
          <p
            className={`text-lg sm:text-xl font-semibold mt-0.5 truncate ${
              selected.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatMoney(selected.profit)}
          </p>
          <p className="text-[11px] sm:text-xs text-purple-300 mt-0.5">
            {selected.margin.toFixed(1)}% margin
          </p>
        </div>
      </div>

      {/* Horizontally scrollable table on narrow screens */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto -mx-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2 font-medium sticky left-0 bg-slate-900/95 z-10">
                  Product
                </th>
                <th className="px-3 py-2 font-medium text-right">Qty</th>
                <th className="px-3 py-2 font-medium text-right">Revenue</th>
                <th className="px-3 py-2 font-medium text-right">Cost</th>
                <th className="px-3 py-2 font-medium text-right">Profit</th>
                <th className="px-3 py-2 font-medium text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rows.map((r) => {
                const m = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0
                return (
                  <tr key={r.sku + r.name} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2 text-white sticky left-0 bg-slate-950/95 sm:bg-transparent">
                      <span className="line-clamp-2">{r.name}</span>
                      {r.sku && (
                        <span className="text-slate-500 text-xs ml-1.5 whitespace-nowrap">
                          {r.sku}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{r.qty}</td>
                    <td className="px-3 py-2 text-right text-slate-300 whitespace-nowrap">
                      {formatMoney(r.revenue)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400 whitespace-nowrap">
                      {formatMoney(r.cost)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium whitespace-nowrap ${
                        r.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {formatMoney(r.profit)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400 whitespace-nowrap">
                      {m.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    {hasRange
                      ? 'No sales for this date range.'
                      : 'Choose a date range and click Generate report.'}
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-slate-950/90 border-t-2 border-slate-700">
                <tr>
                  <td className="px-3 py-3 text-white font-semibold sticky left-0 bg-slate-950">
                    Total ({rows.length} products)
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-white whitespace-nowrap">
                    {rows.reduce((s, r) => s + r.qty, 0)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                    {formatMoney(rows.reduce((s, r) => s + r.revenue, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-300 whitespace-nowrap">
                    {formatMoney(rows.reduce((s, r) => s + r.cost, 0))}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-bold whitespace-nowrap ${
                      rows.reduce((s, r) => s + r.profit, 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {formatMoney(rows.reduce((s, r) => s + r.profit, 0))}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-purple-300 whitespace-nowrap">
                    {(() => {
                      const rev = rows.reduce((s, r) => s + r.revenue, 0)
                      const prof = rows.reduce((s, r) => s + r.profit, 0)
                      return rev > 0 ? ((prof / rev) * 100).toFixed(1) + '%' : '—'
                    })()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
