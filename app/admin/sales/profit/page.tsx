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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
          ← Sales & Analysis
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-1">Profit report</h1>
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

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Sales</p>
          <p className="text-xl font-semibold text-white mt-0.5">{selected.count}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Units</p>
          <p className="text-xl font-semibold text-white mt-0.5">{selected.qty}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-xl font-semibold text-emerald-400 mt-0.5">
            {formatMoney(selected.revenue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Cost</p>
          <p className="text-xl font-semibold text-slate-200 mt-0.5">
            {formatMoney(selected.cost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Profit</p>
          <p
            className={`text-xl font-semibold mt-0.5 ${
              selected.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatMoney(selected.profit)}
          </p>
          <p className="text-xs text-purple-300 mt-0.5">{selected.margin.toFixed(1)}% margin</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
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
                  <td className="px-3 py-2 text-white">
                    {r.name}
                    {r.sku && <span className="text-slate-500 text-xs ml-1.5">{r.sku}</span>}
                  </td>
                  <td className="px-3 py-2 text-right">{r.qty}</td>
                  <td className="px-3 py-2 text-right text-slate-300">
                    {formatMoney(r.revenue)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">{formatMoney(r.cost)}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      r.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatMoney(r.profit)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">{m.toFixed(1)}%</td>
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
        </table>
      </div>
    </div>
  )
}
