import Link from 'next/link'
import { Suspense } from 'react'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'
import ReportFilters from '../report-filters'
import { parseDateRange } from '../report-utils'

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

const BANKS = [
  'CBE',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Coop Bank',
  'Telebirr',
  'CBE Birr',
  'M-Pesa',
  'Other',
]

function paymentCategory(saleType: string | null | undefined): {
  kind: 'cash' | 'card' | 'mb' | 'credit' | 'other'
  bank?: string
} {
  const t = (saleType || 'cash').toLowerCase()
  if (t === 'cash') return { kind: 'cash' }
  if (t === 'card') return { kind: 'card' }
  if (t.startsWith('mb:')) return { kind: 'mb', bank: t.slice(3) }
  if (t === 'mb') return { kind: 'mb' }
  if (t.startsWith('credit')) return { kind: 'credit' }
  return { kind: 'other' }
}

export default async function AdminTransactionsReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    pay?: string
    bank?: string
    q?: string
    generated?: string
  }>
}) {
  const sp = await Promise.resolve(searchParams)
  const payFilter = (sp.pay || 'all').toLowerCase()
  const bankFilter = sp.bank || ''
  const productQ = (sp.q || '').trim().toLowerCase()
  const { from, to, label } = parseDateRange(sp)
  const hasRange = !!(sp.from || sp.to)

  let sales: SaleRow[] = []
  let error: string | null = null
  try {
    sales = await getSalesReport({ limit: 5000, from, to })
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load transactions'
  }

  const banksInData = new Set<string>()
  for (const s of sales) {
    const cat = paymentCategory(s.sale_type)
    if (cat.kind === 'mb' && cat.bank) banksInData.add(cat.bank)
  }
  const bankOptions = Array.from(
    new Set([...BANKS.filter((b) => b !== 'Other'), ...Array.from(banksInData)])
  ).sort()

  let filtered = sales.filter((s) => {
    const cat = paymentCategory(s.sale_type)
    if (payFilter === 'all') return true
    if (payFilter === 'cash') return cat.kind === 'cash'
    if (payFilter === 'card') return cat.kind === 'card'
    if (payFilter === 'mb') {
      if (cat.kind !== 'mb') return false
      if (bankFilter) return (cat.bank || '').toLowerCase() === bankFilter.toLowerCase()
      return true
    }
    return true
  })

  if (productQ) {
    filtered = filtered.filter(
      (s) =>
        s.product_name.toLowerCase().includes(productQ) ||
        (s.product_sku || '').toLowerCase().includes(productQ)
    )
  }

  const totalAmount = filtered.reduce((s, r) => s + (r.total_amount || 0), 0)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
          ← Sales & Analysis
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-1">Transaction report</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {hasRange
            ? `${label}${payFilter !== 'all' ? ` · ${payFilter.toUpperCase()}` : ''}${
                bankFilter ? ` · ${bankFilter}` : ''
              }`
            : 'Select date range, payment type, and generate'}
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-500 text-sm">Loading filters…</div>}>
        <ReportFilters
          options={{
            showPayment: true,
            showBank: true,
            showProductSearch: true,
            banks: bankOptions,
          }}
        />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </span>
        <span className="text-emerald-400 font-medium">{formatMoney(totalAmount)}</span>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-900/80 text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Date / time</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium text-right">Qty</th>
              <th className="px-3 py-2 font-medium text-right">Unit price</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
              <th className="px-3 py-2 font-medium">Payment</th>
              <th className="px-3 py-2 font-medium">Sold by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((s) => {
              const cat = paymentCategory(s.sale_type)
              let payLabel = s.sale_type || 'cash'
              if (cat.kind === 'mb') payLabel = cat.bank ? `MB · ${cat.bank}` : 'MB'
              else if (cat.kind === 'cash') payLabel = 'Cash'
              else if (cat.kind === 'card') payLabel = 'Card'
              return (
                <tr key={s.id} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                    {s.created_at ? formatDate(s.created_at) : '—'}
                  </td>
                  <td className="px-3 py-2 text-white">{s.product_name}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{s.product_sku || '—'}</td>
                  <td className="px-3 py-2 text-right">{s.quantity}</td>
                  <td className="px-3 py-2 text-right text-slate-300">
                    {formatMoney(s.unit_price)}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-400 font-medium">
                    {formatMoney(s.total_amount)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                        cat.kind === 'credit'
                          ? 'bg-amber-950/60 text-amber-300'
                          : cat.kind === 'mb'
                            ? 'bg-amber-950/40 text-amber-200'
                            : cat.kind === 'card'
                              ? 'bg-blue-950/50 text-blue-300'
                              : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {payLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-xs">
                    {s.sold_by_email || s.sold_by || '—'}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                  {hasRange
                    ? 'No transactions for this filter.'
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
