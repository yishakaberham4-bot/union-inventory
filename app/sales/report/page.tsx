import Link from 'next/link'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

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

function labelDay(ymd: string, todayYMD: string, yesterdayYMD: string) {
  if (ymd === todayYMD) return 'Today'
  if (ymd === yesterdayYMD) return 'Yesterday'
  try {
    return new Date(ymd + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ymd
  }
}

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>
}) {
  const sp = await Promise.resolve(searchParams)
  const now = new Date()
  const todayYMD = toYMD(now)
  const yesterdayYMD = toYMD(addDays(now, -1))

  // Only today or yesterday
  const day =
    sp.day === yesterdayYMD || sp.day === 'yesterday'
      ? yesterdayYMD
      : todayYMD
  const from = day
  const to = toYMD(addDays(new Date(day + 'T12:00:00'), 1))

  let sales: SaleRow[] = []
  let loadError: string | null = null

  try {
    sales = await getSalesReport({ limit: 2000, from, to })
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load sales'
  }

  const totalQty = sales.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
  const totalRevenue = sales.reduce(
    (s, r) => s + (Number(r.total_amount) || 0),
    0
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link
              href="/sales/pos"
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              ← Sales Terminal
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">Sales report</h1>
            <p className="text-slate-400 text-sm">
              {labelDay(day, todayYMD, yesterdayYMD)} · product, qty & price
            </p>
          </div>
        </div>

        {/* Today / Yesterday only */}
        <div className="flex gap-2">
          <Link
            href={`/sales/report?day=${todayYMD}`}
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition border ${
              day === todayYMD
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Today
          </Link>
          <Link
            href={`/sales/report?day=${yesterdayYMD}`}
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition border ${
              day === yesterdayYMD
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Yesterday
          </Link>
        </div>

        {/* Simple totals — no profit / cost */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500 uppercase">Items sold</p>
            <p className="text-xl font-semibold text-white mt-1 tabular-nums">
              {totalQty}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500 uppercase">Total sales</p>
            <p className="text-xl font-semibold text-emerald-400 mt-1 tabular-nums">
              {formatMoney(totalRevenue)}
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm">
            <p className="font-medium">Unable to load report</p>
            <p className="text-red-300/90 text-xs mt-1">{loadError}</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500 text-sm">
            No sales {day === todayYMD ? 'today' : 'yesterday'}.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-sm font-medium text-slate-300">Sold products</h2>
              <span className="text-xs text-slate-500">{sales.length} lines</span>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-800">
              {sales.map((s) => (
                <div key={s.id} className="px-4 py-3 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {s.product_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatTime(s.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm tabular-nums">
                      × {s.quantity}
                    </p>
                    <p className="text-emerald-400 font-semibold text-sm tabular-nums">
                      {formatMoney(s.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table — name, qty, price only */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium text-right">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sales.map((s) => (
                    <tr key={s.id} className="bg-slate-950/50 hover:bg-slate-900/80">
                      <td className="px-4 py-3 text-white font-medium">
                        {s.product_name}
                      </td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">
                        {s.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium tabular-nums">
                        {formatMoney(s.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatTime(s.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/90 border-t border-slate-700">
                  <tr>
                    <td className="px-4 py-3 text-slate-300 font-semibold">Total</td>
                    <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">
                      {totalQty}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold tabular-nums">
                      {formatMoney(totalRevenue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
