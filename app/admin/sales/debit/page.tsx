import Link from 'next/link'
import { Suspense } from 'react'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'
import ReportFilters from '../report-filters'
import { parseDateRange } from '../report-utils'
import PayCreditButton from './pay-button'

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

function outstandingOf(s: SaleRow) {
  const credit = s.credit_amount != null ? s.credit_amount : s.total_amount || 0
  const paid = s.paid_amount || 0
  return Math.max(0, credit - paid)
}

export default async function AdminDebitPage({
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
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load debit data'
  }

  // Only credit sales that still have outstanding balance
  let debitSales = sales.filter((s) => {
    if (!(s.sale_type || '').startsWith('credit')) return false
    return outstandingOf(s) > 0
  })

  if (productQ) {
    debitSales = debitSales.filter(
      (s) =>
        s.product_name.toLowerCase().includes(productQ) ||
        (s.product_sku || '').toLowerCase().includes(productQ) ||
        (s.credit_customer_name || '').toLowerCase().includes(productQ) ||
        (s.credit_phone || '').includes(productQ)
    )
  }

  const subtotalQty = debitSales.reduce((sum, s) => sum + (s.quantity || 0), 0)
  const subtotalCredit = debitSales.reduce((sum, s) => {
    const credit = s.credit_amount != null ? s.credit_amount : s.total_amount || 0
    return sum + credit
  }, 0)
  const subtotalOutstanding = debitSales.reduce((sum, s) => sum + outstandingOf(s), 0)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
          ← Sales & Analysis
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-1">Debit</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Products purchased on credit — outstanding balances
          {hasRange ? ` · ${label}` : ''}
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-500 text-sm">Loading filters…</div>}>
        <ReportFilters options={{ showProductSearch: true }} />
      </Suspense>
      <p className="text-xs text-slate-500 -mt-2">
        Search matches product, customer name, or phone. Pay requires admin password.
      </p>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Open credits</p>
          <p className="text-xl font-semibold text-white mt-0.5">{debitSales.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Units on credit</p>
          <p className="text-xl font-semibold text-amber-300 mt-0.5">{subtotalQty}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Outstanding total</p>
          <p className="text-xl font-semibold text-red-300 mt-0.5">
            {formatMoney(subtotalOutstanding)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium text-right">Qty</th>
              <th className="px-3 py-2 font-medium text-right">Unit</th>
              <th className="px-3 py-2 font-medium text-right">Total price</th>
              <th className="px-3 py-2 font-medium text-right">Outstanding</th>
              <th className="px-3 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {debitSales.map((s) => {
              const outstanding = outstandingOf(s)
              return (
                <tr key={s.id} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                    {s.created_at ? formatDate(s.created_at) : '—'}
                  </td>
                  <td className="px-3 py-2 text-white">
                    {s.credit_customer_name || '—'}
                    {s.credit_phone && (
                      <span className="block text-xs text-slate-500">{s.credit_phone}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {s.product_name}
                    {s.product_sku && (
                      <span className="text-slate-500 text-xs ml-1">{s.product_sku}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{s.quantity}</td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {formatMoney(s.unit_price)}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-300">
                    {formatMoney(
                      s.credit_amount != null ? s.credit_amount : s.total_amount || 0
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-red-300 font-medium">
                    {formatMoney(outstanding)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <PayCreditButton
                      saleId={s.id}
                      productName={s.product_name}
                      outstanding={outstanding}
                    />
                  </td>
                </tr>
              )
            })}
            {debitSales.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                  {hasRange
                    ? 'No outstanding credit purchases for this filter.'
                    : 'Choose a date range and click Generate report, or leave empty for all.'}
                </td>
              </tr>
            )}
          </tbody>
          {debitSales.length > 0 && (
            <tfoot className="bg-slate-900/90 border-t border-slate-700">
              <tr>
                <td className="px-3 py-3 text-slate-300 font-semibold" colSpan={3}>
                  Subtotal (credits)
                </td>
                <td className="px-3 py-3 text-right text-white font-semibold">
                  {subtotalQty}
                </td>
                <td className="px-3 py-3 text-right text-slate-500">—</td>
                <td className="px-3 py-3 text-right text-amber-300 font-semibold">
                  {formatMoney(subtotalCredit)}
                </td>
                <td className="px-3 py-3 text-right text-red-300 font-semibold">
                  {formatMoney(subtotalOutstanding)}
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
