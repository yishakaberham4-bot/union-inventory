import Link from 'next/link'
import { Suspense } from 'react'
import {
  getSalesReport,
  getReturnedSales,
  type SaleRow,
  type ReturnedSaleRow,
} from '@/app/actions/sales'
import ReturnSaleButton from './return-button'
import ReportFilters from '../report-filters'
import { parseDateRange, matchSaleType } from '../report-utils'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}


export default async function AdminGeneralReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    type?: string
    q?: string
    view?: string
    generated?: string
  }>
}) {
  const sp = await Promise.resolve(searchParams)
  const view = sp.view === 'returned' ? 'returned' : 'sales'
  const typeFilter = (sp.type || 'all').toLowerCase()
  const productQ = (sp.q || '').trim().toLowerCase()
  const { from, to, label } = parseDateRange(sp)
  const hasRange = !!(sp.from || sp.to)

  let sales: SaleRow[] = []
  let returns: ReturnedSaleRow[] = []
  let error: string | null = null

  try {
    if (view === 'returned') {
      returns = await getReturnedSales(1000)
      if (hasRange) {
        returns = returns.filter((r) => {
          const d = (r.returned_at || '').slice(0, 10)
          if (sp.from && d < sp.from) return false
          if (sp.to && d > sp.to) return false
          return true
        })
      }
      if (productQ) {
        returns = returns.filter(
          (r) =>
            r.product_name.toLowerCase().includes(productQ) ||
            (r.product_sku || '').toLowerCase().includes(productQ)
        )
      }
    } else {
      sales = await getSalesReport({ limit: 5000, from, to })
      if (typeFilter !== 'all') {
        sales = sales.filter((s) => matchSaleType(s.sale_type, typeFilter))
      }
      if (productQ) {
        sales = sales.filter(
          (s) =>
            s.product_name.toLowerCase().includes(productQ) ||
            (s.product_sku || '').toLowerCase().includes(productQ)
        )
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load report'
  }

  const revenue = sales.reduce((s, r) => s + (r.total_amount || 0), 0)
  const cost = sales.reduce((s, r) => s + (r.unit_cost || 0) * (r.quantity || 0), 0)
  const qty = sales.reduce((s, r) => s + (r.quantity || 0), 0)
  const profit = revenue - cost

  const returnQty = returns.reduce((s, r) => s + (r.quantity || 0), 0)
  const returnAmount = returns.reduce((s, r) => s + (r.total_amount || 0), 0)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
            ← Sales & Analysis
          </Link>
          <h1 className="text-2xl font-semibold text-white mt-1">
            {view === 'returned' ? 'Returned products' : 'General report'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {view === 'returned'
              ? hasRange
                ? `Returned · ${label}`
                : 'Products returned to stock'
              : hasRange
                ? label
                : 'Select date range and filters, then generate'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/admin/sales/report"
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              view === 'sales'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Sales
          </Link>
          <Link
            href="/admin/sales/report?view=returned"
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              view === 'returned'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Returned products
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-slate-500 text-sm">Loading filters…</div>}>
        <ReportFilters
          options={{
            showSaleType: view === 'sales',
            showProductSearch: true,
            preserve: view === 'returned' ? { view: 'returned' } : {},
          }}
        />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {view === 'returned' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">Return records</p>
              <p className="text-xl font-semibold text-white mt-0.5">{returns.length}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">Units returned</p>
              <p className="text-xl font-semibold text-orange-300 mt-0.5">{returnQty}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">Amount reversed</p>
              <p className="text-xl font-semibold text-orange-300 mt-0.5">
                {formatMoney(returnAmount)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-400 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Returned at</th>
                  <th className="px-3 py-2 font-medium">Original sale</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap text-xs">
                      {r.returned_at ? formatDate(r.returned_at) : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                      {r.original_created_at ? formatDate(r.original_created_at) : '—'}
                    </td>
                    <td className="px-3 py-2 text-white">
                      {r.product_name}
                      {r.product_sku && (
                        <span className="text-slate-500 text-xs ml-1">{r.product_sku}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-orange-300">{r.quantity}</td>
                    <td className="px-3 py-2 text-right text-orange-300 font-medium">
                      {formatMoney(r.total_amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                        {r.sale_type || 'cash'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-xs max-w-[160px] truncate">
                      {r.reason || '—'}
                    </td>
                  </tr>
                ))}
                {returns.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                      No returned products for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
              {returns.length > 0 && (
                <tfoot className="bg-slate-900/90 border-t border-slate-700">
                  <tr>
                    <td className="px-3 py-3 text-slate-300 font-semibold" colSpan={3}>
                      Total (returned products)
                    </td>
                    <td className="px-3 py-3 text-right text-orange-300 font-semibold">
                      {returnQty}
                    </td>
                    <td className="px-3 py-3 text-right text-orange-300 font-semibold">
                      {formatMoney(returnAmount)}
                    </td>
                    <td className="px-3 py-3" colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">Transactions</p>
              <p className="text-xl font-semibold text-white mt-0.5">{sales.length}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">Units sold</p>
              <p className="text-xl font-semibold text-white mt-0.5">{qty}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">Revenue</p>
              <p className="text-xl font-semibold text-emerald-400 mt-0.5">
                {formatMoney(revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <p className="text-xs text-slate-500">Gross profit</p>
              <p
                className={`text-xl font-semibold mt-0.5 ${
                  profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatMoney(profit)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-400 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Unit</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Sold by</th>
                  <th className="px-3 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap text-xs">
                      {s.created_at ? formatDate(s.created_at) : '—'}
                    </td>
                    <td className="px-3 py-2 text-white">
                      {s.product_name}
                      {s.product_sku && (
                        <span className="text-slate-500 text-xs ml-1">{s.product_sku}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">{s.quantity}</td>
                    <td className="px-3 py-2 text-right text-slate-400">
                      {formatMoney(s.unit_price)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-400 font-medium">
                      {formatMoney(s.total_amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                          (s.sale_type || '').startsWith('credit')
                            ? 'bg-amber-950/60 text-amber-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {s.sale_type || 'cash'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-xs">
                      {s.sold_by_email || s.sold_by || '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <ReturnSaleButton
                        saleId={s.id}
                        productName={s.product_name}
                        quantity={s.quantity}
                      />
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && !error && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                      {hasRange
                        ? 'No sales for this date range and filters.'
                        : 'Choose a date range above and click Generate report.'}
                    </td>
                  </tr>
                )}
              </tbody>
              {sales.length > 0 && (
                <tfoot className="bg-slate-900/90 border-t border-slate-700">
                  <tr>
                    <td className="px-3 py-3 text-slate-300 font-semibold" colSpan={2}>
                      Total (all products)
                    </td>
                    <td className="px-3 py-3 text-right text-white font-semibold">
                      {qty}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-500">—</td>
                    <td className="px-3 py-3 text-right text-emerald-400 font-semibold">
                      {formatMoney(revenue)}
                    </td>
                    <td className="px-3 py-3" colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  )
}
