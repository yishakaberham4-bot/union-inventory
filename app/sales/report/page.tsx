import Link from 'next/link'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'

function formatMoney(n: number) {
  return n.toFixed(2)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

type Period = 'day' | 'week' | 'month' | 'all'

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Monday of the week containing d (local) */
function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = x.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endExclusiveForPeriod(
  period: Period,
  anchor: Date
): { from: string | null; to: string | null; label: string } {
  if (period === 'all') {
    return { from: null, to: null, label: 'All time' }
  }
  if (period === 'day') {
    const from = toYMD(anchor)
    const to = toYMD(addDays(anchor, 1))
    return {
      from,
      to,
      label: formatShortDate(anchor.toISOString()),
    }
  }
  if (period === 'week') {
    const start = startOfWeek(anchor)
    const end = addDays(start, 7)
    return {
      from: toYMD(start),
      to: toYMD(end),
      label: `${formatShortDate(start.toISOString())} – ${formatShortDate(addDays(start, 6).toISOString())}`,
    }
  }
  // month
  const start = startOfMonth(anchor)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  return {
    from: toYMD(start),
    to: toYMD(end),
    label: start.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    }),
  }
}

function shiftAnchor(period: Period, anchor: Date, dir: -1 | 1): Date {
  const x = new Date(anchor)
  if (period === 'day') {
    x.setDate(x.getDate() + dir)
  } else if (period === 'week') {
    x.setDate(x.getDate() + dir * 7)
  } else if (period === 'month') {
    x.setMonth(x.getMonth() + dir)
  }
  return x
}

type SearchParams = Promise<{ period?: string; date?: string }> | { period?: string; date?: string }

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const sp = searchParams ? await Promise.resolve(searchParams) : {}
  const periodRaw = (sp.period || 'day').toLowerCase()
  const period: Period = ['day', 'week', 'month', 'all'].includes(periodRaw)
    ? (periodRaw as Period)
    : 'day'

  let anchor = new Date()
  if (sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)) {
    const [y, m, d] = sp.date.split('-').map(Number)
    anchor = new Date(y, m - 1, d)
  }

  const { from, to, label: periodLabel } = endExclusiveForPeriod(period, anchor)

  let sales: SaleRow[] = []
  let loadError: string | null = null

  try {
    sales = await getSalesReport({
      limit: period === 'all' ? 500 : 1000,
      from,
      to,
    })
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load sales report'
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0)
  const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0)
  const totalCost = sales.reduce((sum, s) => sum + s.unit_cost * s.quantity, 0)
  const totalProfit = totalRevenue - totalCost
  const totalCredit = sales.reduce(
    (sum, s) => sum + (s.credit_amount != null ? s.credit_amount : 0),
    0
  )

  // Group by day for week/month views
  const byDay = new Map<string, { sales: number; qty: number; revenue: number; profit: number }>()
  if (period === 'week' || period === 'month') {
    for (const s of sales) {
      const key = s.created_at ? s.created_at.slice(0, 10) : 'unknown'
      const cur = byDay.get(key) || { sales: 0, qty: 0, revenue: 0, profit: 0 }
      cur.sales += 1
      cur.qty += s.quantity
      cur.revenue += s.total_amount
      cur.profit += s.total_amount - s.unit_cost * s.quantity
      byDay.set(key, cur)
    }
  }
  const dayRows = Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0]))

  const prevDate = toYMD(shiftAnchor(period, anchor, -1))
  const nextDate = toYMD(shiftAnchor(period, anchor, 1))
  const todayYMD = toYMD(new Date())

  function periodHref(p: Period, date?: string) {
    const q = new URLSearchParams()
    q.set('period', p)
    if (p !== 'all' && date) q.set('date', date)
    return `/sales/report?${q.toString()}`
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Report</h1>
          <p className="text-sm text-slate-400 mt-1">
            View by day, week or month
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/sales/make"
            className="text-sm px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition"
          >
            + Make Sale
          </Link>
          <Link
            href="/sales/pos"
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'day' as const, label: 'By day' },
            { id: 'week' as const, label: 'By week' },
            { id: 'month' as const, label: 'By month' },
            { id: 'all' as const, label: 'All' },
          ] as const
        ).map((t) => (
          <Link
            key={t.id}
            href={periodHref(t.id, t.id === 'all' ? undefined : toYMD(anchor))}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
              period === t.id
                ? 'bg-emerald-700 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Date navigation */}
      {period !== 'all' && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
          <Link
            href={periodHref(period, prevDate)}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            ← Prev
          </Link>
          <div className="text-center">
            <p className="text-white font-semibold">{periodLabel}</p>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{period}</p>
          </div>
          <div className="flex gap-2">
            {toYMD(anchor) !== todayYMD && (
              <Link
                href={periodHref(period, todayYMD)}
                className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Today
              </Link>
            )}
            <Link
              href={periodHref(period, nextDate)}
              className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Next →
            </Link>
          </div>
        </div>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm space-y-2">
          <p className="font-medium">Unable to load report</p>
          <p className="text-red-300/90 text-xs">{loadError}</p>
          <p className="text-red-300/70 text-xs">
            Please try again or contact your system administrator.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-500 uppercase">Sales</p>
              <p className="text-xl font-semibold text-white mt-1">{sales.length}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-500 uppercase">Items sold</p>
              <p className="text-xl font-semibold text-white mt-1">{totalQty}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-500 uppercase">Revenue</p>
              <p className="text-xl font-semibold text-emerald-400 mt-1">
                {formatMoney(totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-500 uppercase">Est. profit</p>
              <p className="text-xl font-semibold text-sky-300 mt-1">
                {formatMoney(totalProfit)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs text-slate-500 uppercase">On credit</p>
              <p className="text-xl font-semibold text-amber-300 mt-1">
                {formatMoney(totalCredit)}
              </p>
            </div>
          </div>

          {/* Daily breakdown for week / month */}
          {(period === 'week' || period === 'month') && dayRows.length > 0 && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800">
                <h2 className="text-sm font-medium text-slate-300">
                  Daily breakdown
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Sales</th>
                      <th className="px-4 py-2 font-medium">Items</th>
                      <th className="px-4 py-2 font-medium">Revenue</th>
                      <th className="px-4 py-2 font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {dayRows.map(([day, row]) => (
                      <tr key={day} className="bg-slate-950/50 hover:bg-slate-900/80">
                        <td className="px-4 py-2.5">
                          <Link
                            href={periodHref('day', day)}
                            className="text-emerald-400 hover:underline"
                          >
                            {formatShortDate(day + 'T12:00:00')}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-white">{row.sales}</td>
                        <td className="px-4 py-2.5 text-slate-300">{row.qty}</td>
                        <td className="px-4 py-2.5 text-emerald-400 font-medium">
                          {formatMoney(row.revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-sky-300">
                          {formatMoney(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sales.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
              No sales in this period.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-sm font-medium text-slate-300">
                  Sale details
                </h2>
                <span className="text-xs text-slate-500">{sales.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Unit price</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {sales.map((s) => (
                      <tr key={s.id} className="bg-slate-950/50 hover:bg-slate-900/80">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {formatDate(s.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{s.product_name}</div>
                          <div className="text-xs text-slate-500">{s.product_sku}</div>
                        </td>
                        <td className="px-4 py-3 text-white">{s.quantity}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatMoney(s.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">
                          {formatMoney(s.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs ${
                              s.sale_type?.startsWith('credit')
                                ? 'bg-amber-900/60 text-amber-200'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {s.sale_type?.startsWith('mb:')
                              ? `MB · ${s.sale_type.slice(3)}`
                              : s.sale_type?.startsWith('credit:full')
                                ? 'Credit (full)'
                                : s.sale_type?.startsWith('credit:two')
                                  ? `Credit (half) · paid via ${s.sale_type.split(':').slice(2).join(':')}`
                                  : s.sale_type}
                          </span>
                          {s.credit_customer_name && (
                            <div className="text-xs text-amber-300/80 mt-1">
                              {s.credit_customer_name}
                              {s.credit_phone ? ` · ${s.credit_phone}` : ''}
                              {s.credit_amount != null
                                ? ` · credit ${formatMoney(s.credit_amount)}`
                                : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {s.sold_by_email || '—'}
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
  )
}
