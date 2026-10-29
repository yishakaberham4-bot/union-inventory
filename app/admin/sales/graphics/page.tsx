import Link from 'next/link'
import { Suspense } from 'react'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'
import ReportFilters from '../report-filters'
import { parseDateRange } from '../report-utils'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type ViewMode = 'daily' | 'weekly' | 'monthly'

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function buildBuckets(mode: ViewMode, sales: SaleRow[], fromStr: string | null, toStr: string | null) {
  const buckets: { key: string; label: string; revenue: number; count: number }[] = []
  const end = toStr
    ? new Date(toStr + 'T12:00:00')
    : new Date()
  // toStr from parseDateRange is exclusive next day — use inclusive end for display
  if (toStr) end.setDate(end.getDate() - 1)

  const start = fromStr
    ? new Date(fromStr + 'T12:00:00')
    : (() => {
        const d = new Date(end)
        if (mode === 'daily') d.setDate(d.getDate() - 13)
        else if (mode === 'weekly') d.setDate(d.getDate() - 7 * 7)
        else d.setMonth(d.getMonth() - 11)
        return d
      })()

  if (mode === 'daily') {
    const cur = new Date(start)
    cur.setHours(12, 0, 0, 0)
    const endDay = new Date(end)
    endDay.setHours(12, 0, 0, 0)
    while (cur <= endDay) {
      const key = toYMD(cur)
      buckets.push({ key, label: key.slice(5), revenue: 0, count: 0 })
      cur.setDate(cur.getDate() + 1)
    }
    const map = new Map(buckets.map((b) => [b.key, b]))
    for (const s of sales) {
      if (!s.created_at) continue
      const key = s.created_at.slice(0, 10)
      const b = map.get(key)
      if (b) {
        b.revenue += s.total_amount || 0
        b.count += 1
      }
    }
  } else if (mode === 'weekly') {
    let cur = startOfWeek(start)
    const endWeek = startOfWeek(end)
    while (cur <= endWeek) {
      const weekEnd = new Date(cur)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const key = toYMD(cur)
      buckets.push({
        key,
        label: `${toYMD(cur).slice(5)}–${toYMD(weekEnd).slice(5)}`,
        revenue: 0,
        count: 0,
      })
      cur = new Date(cur)
      cur.setDate(cur.getDate() + 7)
    }
    const map = new Map(buckets.map((b) => [b.key, b]))
    for (const s of sales) {
      if (!s.created_at) continue
      const dt = new Date(s.created_at)
      const key = toYMD(startOfWeek(dt))
      const b = map.get(key)
      if (b) {
        b.revenue += s.total_amount || 0
        b.count += 1
      }
    }
  } else {
    let y = start.getFullYear()
    let m = start.getMonth()
    const endY = end.getFullYear()
    const endM = end.getMonth()
    while (y < endY || (y === endY && m <= endM)) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}`
      const d = new Date(y, m, 1)
      buckets.push({
        key,
        label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        revenue: 0,
        count: 0,
      })
      m += 1
      if (m > 11) {
        m = 0
        y += 1
      }
    }
    const map = new Map(buckets.map((b) => [b.key, b]))
    for (const s of sales) {
      if (!s.created_at) continue
      const key = s.created_at.slice(0, 7)
      const b = map.get(key)
      if (b) {
        b.revenue += s.total_amount || 0
        b.count += 1
      }
    }
  }

  return buckets
}

export default async function AdminGraphicReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string
    to?: string
    view?: string
    type?: string
    generated?: string
  }>
}) {
  const sp = await Promise.resolve(searchParams)
  const view = (['daily', 'weekly', 'monthly'].includes(sp.view || '')
    ? sp.view
    : 'daily') as ViewMode
  const typeFilter = (sp.type || 'all').toLowerCase()
  const { from, to, label } = parseDateRange(sp)
  const hasRange = !!(sp.from || sp.to)

  let sales: SaleRow[] = []
  let error: string | null = null
  try {
    sales = await getSalesReport({ limit: 5000, from, to })
    if (typeFilter !== 'all') {
      sales = sales.filter((s) => {
        const t = (s.sale_type || 'cash').toLowerCase()
        if (typeFilter === 'cash') return t === 'cash'
        if (typeFilter === 'card') return t === 'card'
        if (typeFilter === 'mb') return t === 'mb' || t.startsWith('mb:')
        if (typeFilter === 'credit') return t.startsWith('credit')
        return true
      })
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load data'
  }

  const buckets = buildBuckets(view, sales, from, to)
  const maxRev = Math.max(...buckets.map((b) => b.revenue), 1)
  const totalRev = buckets.reduce((s, b) => s + b.revenue, 0)
  const totalCount = buckets.reduce((s, b) => s + b.count, 0)

  const last = buckets.length ? buckets[buckets.length - 1] : null
  const prev = buckets.length > 1 ? buckets[buckets.length - 2] : null
  const delta = last && prev ? last.revenue - prev.revenue : 0
  const deltaPct =
    last && prev && prev.revenue > 0
      ? ((last.revenue - prev.revenue) / prev.revenue) * 100
      : last && prev && last.revenue > 0
        ? 100
        : 0

  const withChange = buckets.map((b, i) => {
    const before = i > 0 ? buckets[i - 1].revenue : null
    const change = before == null ? null : b.revenue - before
    return { ...b, change }
  })

  const w = 100
  const h = 40
  const pts = buckets.map((b, i) => {
    const x = buckets.length <= 1 ? w / 2 : (i / (buckets.length - 1)) * w
    const y = h - (b.revenue / maxRev) * (h - 2) - 1
    return `${x},${y}`
  })
  const linePath = pts.length ? `M ${pts.join(' L ')}` : ''
  const areaPath = pts.length
    ? `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`
    : ''

  const views: { key: ViewMode; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ]

  function viewLink(v: ViewMode) {
    const params = new URLSearchParams()
    params.set('view', v)
    if (sp.from) params.set('from', sp.from)
    if (sp.to) params.set('to', sp.to)
    if (sp.type) params.set('type', sp.type)
    if (sp.generated) params.set('generated', sp.generated)
    return `/admin/sales/graphics?${params.toString()}`
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
            ← Sales & Analysis
          </Link>
          <h1 className="text-2xl font-semibold text-white mt-1">Graphic report</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {hasRange ? label : 'Select date range and chart type, then generate'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {views.map((v) => (
            <Link
              key={v.key}
              href={viewLink(v.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                view === v.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      <Suspense fallback={<div className="text-slate-500 text-sm">Loading filters…</div>}>
        <ReportFilters
          options={{
            showSaleType: true,
            preserve: { view },
          }}
        />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-slate-500">Period total</p>
          <p className="text-2xl font-semibold text-emerald-400">{formatMoney(totalRev)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Transactions</p>
          <p className="text-2xl font-semibold text-white">{totalCount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Chart</p>
          <p className="text-lg font-medium text-purple-300 capitalize">{view}</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            {view} sales chart
          </h2>
          {last && prev ? (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                delta >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              <span className="text-base leading-none">{delta >= 0 ? '▲' : '▼'}</span>
              <span>
                {delta >= 0 ? '+' : ''}
                {formatMoney(delta)}
              </span>
              <span className="text-xs opacity-80">
                ({deltaPct >= 0 ? '+' : ''}
                {deltaPct.toFixed(1)}% vs previous)
              </span>
            </div>
          ) : null}
        </div>

        {buckets.length === 0 ? (
          <p className="text-slate-500 text-sm py-8 text-center">
            Choose a date range and click Generate report.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4 overflow-hidden">
              <svg
                viewBox={`0 0 ${w} ${h}`}
                className="w-full h-28 sm:h-36"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#revFill)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="rgb(52 211 153)"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            <div className="flex items-end gap-1.5 h-56 overflow-x-auto pb-1">
              {withChange.map((b) => {
                const pct = (b.revenue / maxRev) * 100
                const up = b.change != null && b.change > 0
                const down = b.change != null && b.change < 0
                return (
                  <div
                    key={b.key}
                    className="flex-1 min-w-[36px] flex flex-col items-center gap-1"
                  >
                    <div className="h-4 flex items-center justify-center">
                      {up ? (
                        <span className="text-[10px] text-emerald-400 font-bold">▲</span>
                      ) : down ? (
                        <span className="text-[10px] text-rose-400 font-bold">▼</span>
                      ) : (
                        <span className="text-[10px] text-slate-600">·</span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 truncate w-full text-center tabular-nums">
                      {b.revenue > 0 ? formatMoney(b.revenue) : ''}
                    </span>
                    <div className="w-full flex-1 flex items-end min-h-[80px]">
                      <div
                        className={`w-full rounded-t-lg min-h-[3px] transition-all shadow-lg ${
                          up
                            ? 'bg-gradient-to-t from-emerald-700 to-emerald-400 shadow-emerald-900/40'
                            : down
                              ? 'bg-gradient-to-t from-rose-800 to-rose-400 shadow-rose-900/30'
                              : view === 'daily'
                                ? 'bg-gradient-to-t from-emerald-800 to-emerald-500/90'
                                : view === 'weekly'
                                  ? 'bg-gradient-to-t from-blue-800 to-sky-400'
                                  : 'bg-gradient-to-t from-purple-900 to-fuchsia-400'
                        }`}
                        style={{ height: `${Math.max(b.revenue > 0 ? 6 : 2, pct)}%` }}
                        title={`${b.label}: ${formatMoney(b.revenue)} (${b.count} sales)`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 truncate w-full text-center">
                      {b.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
          Breakdown
        </h2>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium text-right">Sales</th>
                <th className="px-3 py-2 font-medium text-right">Revenue</th>
                <th className="px-3 py-2 font-medium text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {buckets.map((b) => {
                const share = totalRev > 0 ? (b.revenue / totalRev) * 100 : 0
                return (
                  <tr key={b.key} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2 text-white">{b.label}</td>
                    <td className="px-3 py-2 text-right text-slate-300">{b.count}</td>
                    <td className="px-3 py-2 text-right text-emerald-400 font-medium">
                      {formatMoney(b.revenue)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">
                      {share.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
              {buckets.every((b) => b.revenue === 0) && !error && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    No sales data for this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
