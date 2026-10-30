import Link from 'next/link'
import { Suspense } from 'react'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'
import ReportFilters from '../report-filters'
import { parseDateRange } from '../report-utils'
import PayCreditButton from '../debit/pay-button'
import { checkAndNotifyOverdueCredits } from '@/app/actions/notifications'

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

export default async function AdminCreditReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; q?: string; generated?: string }>
}) {
  const sp = await Promise.resolve(searchParams)
  const productQ = (sp.q || '').trim().toLowerCase()
  const { from, to, label } = parseDateRange(sp)
  const hasRange = !!(sp.from || sp.to)

  // Opportunistically scan for overdue credits (non-blocking for page render)
  try {
    await checkAndNotifyOverdueCredits()
  } catch {
    // ignore scan errors
  }

  let sales: SaleRow[] = []
  let error: string | null = null
  try {
    sales = await getSalesReport({ limit: 5000, from, to })
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load credit data'
  }

  let creditSales = sales.filter((s) => (s.sale_type || '').startsWith('credit'))
  if (productQ) {
    creditSales = creditSales.filter(
      (s) =>
        s.product_name.toLowerCase().includes(productQ) ||
        (s.product_sku || '').toLowerCase().includes(productQ) ||
        (s.credit_customer_name || '').toLowerCase().includes(productQ) ||
        (s.credit_phone || '').includes(productQ)
    )
  }

  const totalCredit = creditSales.reduce(
    (sum, s) => sum + (s.credit_amount != null ? s.credit_amount : s.total_amount || 0),
    0
  )
  const totalPaid = creditSales.reduce((sum, s) => sum + (s.paid_amount || 0), 0)
  const outstanding = totalCredit - totalPaid

  type CustomerAgg = {
    name: string
    phone: string
    count: number
    credit: number
    paid: number
  }
  const byCustomer = new Map<string, CustomerAgg>()
  for (const s of creditSales) {
    const name = s.credit_customer_name || 'Unknown'
    const phone = s.credit_phone || '—'
    const key = `${name}|${phone}`
    const existing = byCustomer.get(key) || {
      name,
      phone,
      count: 0,
      credit: 0,
      paid: 0,
    }
    existing.count += 1
    existing.credit += s.credit_amount != null ? s.credit_amount : s.total_amount || 0
    existing.paid += s.paid_amount || 0
    byCustomer.set(key, existing)
  }
  const customers = Array.from(byCustomer.values()).sort(
    (a, b) => b.credit - b.paid - (a.credit - a.paid)
  )

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-5 sm:space-y-6 min-w-0">
      <div>
        <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
          ← Sales & Analysis
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-1">Credit report</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {hasRange ? label : 'Select date range and generate credit report'}
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-500 text-sm">Loading filters…</div>}>
        <ReportFilters
          options={{ showProductSearch: true }}
        />
      </Suspense>
      <p className="text-xs text-slate-500 -mt-2">
        Product search also matches customer name or phone.
      </p>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Credit sales</p>
          <p className="text-xl font-semibold text-white mt-0.5">{creditSales.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Total credit</p>
          <p className="text-xl font-semibold text-amber-300 mt-0.5">{formatMoney(totalCredit)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Paid so far</p>
          <p className="text-xl font-semibold text-emerald-400 mt-0.5">{formatMoney(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className="text-xl font-semibold text-red-300 mt-0.5">{formatMoney(outstanding)}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">
          By customer
        </h2>
        {/* Mobile cards */}
        <div className="md:hidden space-y-2 mb-6">
          {customers.map((c) => (
            <div
              key={c.name + c.phone}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2"
            >
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone || '—'}</p>
                </div>
                <p className="text-red-300 font-semibold tabular-nums text-sm shrink-0">
                  {formatMoney(c.credit - c.paid)}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>{c.count} sales</span>
                <span className="text-amber-300">Credit {formatMoney(c.credit)}</span>
                <span className="text-emerald-400">Paid {formatMoney(c.paid)}</span>
              </div>
            </div>
          ))}
          {customers.length === 0 && !error && (
            <p className="text-center text-slate-500 py-8 text-sm">
              {hasRange
                ? 'No credit customers in this range.'
                : 'Choose a date range and click Generate report.'}
            </p>
          )}
        </div>
        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-slate-800 overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium text-right">Sales</th>
                <th className="px-3 py-2 font-medium text-right">Credit</th>
                <th className="px-3 py-2 font-medium text-right">Paid</th>
                <th className="px-3 py-2 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {customers.map((c) => (
                <tr key={c.name + c.phone} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2 text-white font-medium">{c.name}</td>
                  <td className="px-3 py-2 text-slate-400">{c.phone}</td>
                  <td className="px-3 py-2 text-right">{c.count}</td>
                  <td className="px-3 py-2 text-right text-amber-300">{formatMoney(c.credit)}</td>
                  <td className="px-3 py-2 text-right text-emerald-400">{formatMoney(c.paid)}</td>
                  <td className="px-3 py-2 text-right text-red-300 font-medium">
                    {formatMoney(c.credit - c.paid)}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && !error && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    {hasRange
                      ? 'No credit customers in this range.'
                      : 'Choose a date range and click Generate report.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">
          Credit transactions
        </h2>
        
        <div className="md:hidden space-y-2">
          {creditSales.map((s) => {
            const creditAmt =
              s.credit_amount != null ? s.credit_amount : s.total_amount || 0
            const paid = s.paid_amount || 0
            const outstanding = Math.max(0, creditAmt - paid)
            return (
              <div
                key={s.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2"
              >
                <div className="flex justify-between gap-2 items-start">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {s.credit_customer_name || '—'}
                    </p>
                    <p className="text-xs text-slate-500">{s.credit_phone || ''}</p>
                    <p className="text-sm text-slate-300 mt-1 truncate">{s.product_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-amber-300 font-semibold tabular-nums text-sm">
                      {formatMoney(creditAmt)}
                    </p>
                    <p className="text-[11px] text-slate-500">credit</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>{s.created_at ? formatDate(s.created_at) : '—'}</span>
                  <span>Total {formatMoney(s.total_amount)}</span>
                  <span className="text-emerald-400">Paid {formatMoney(paid)}</span>
                  <span className="text-red-300">Due {formatMoney(outstanding)}</span>
                  <span className="text-amber-200/80">{s.sale_type}</span>
                </div>
                <div className="flex justify-end pt-1">
                  <PayCreditButton
                    saleId={s.id}
                    productName={s.product_name}
                    outstanding={outstanding}
                  />
                </div>
              </div>
            )
          })}
          {creditSales.length === 0 && !error && (
            <p className="text-center text-slate-500 py-8 text-sm">
              {hasRange
                ? 'No credit sales in this range.'
                : 'Choose a date range and click Generate report.'}
            </p>
          )}
        </div>
        <div className="hidden md:block rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium text-right">Credit</th>
                <th className="px-3 py-2 font-medium text-right">Paid</th>
                <th className="px-3 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {creditSales.map((s) => {
                const creditAmt =
                  s.credit_amount != null ? s.credit_amount : s.total_amount || 0
                const paid = s.paid_amount || 0
                const outstanding = Math.max(0, creditAmt - paid)
                return (
                  <tr key={s.id} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                      {s.created_at ? formatDate(s.created_at) : '—'}
                    </td>
                    <td className="px-3 py-2 text-white">
                      {s.credit_customer_name || '—'}
                      {s.credit_phone && (
                        <span className="block text-xs text-slate-500">
                          {s.credit_phone}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{s.product_name}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-amber-950/60 text-amber-300">
                        {s.sale_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatMoney(s.total_amount)}
                    </td>
                    <td className="px-3 py-2 text-right text-amber-300">
                      {formatMoney(creditAmt)}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-400">
                      {formatMoney(paid)}
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
              {creditSales.length === 0 && !error && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                    No credit sales for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
