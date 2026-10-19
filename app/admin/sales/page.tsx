import Link from 'next/link'
import { getSalesReport } from '@/app/actions/sales'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function AdminSalesPage() {
  let sales: Awaited<ReturnType<typeof getSalesReport>> = []
  let error: string | null = null
  try {
    sales = await getSalesReport({ limit: 50 })
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load sales'
  }

  const totalRevenue = sales.reduce((s, r) => s + (r.total_amount || 0), 0)
  const totalQty = sales.reduce((s, r) => s + (r.quantity || 0), 0)
  const creditSales = sales.filter((r) => (r.sale_type || '').startsWith('credit'))
  const cashSales = sales.filter((r) => !(r.sale_type || '').startsWith('credit'))

  const cards = [
    {
      href: '/admin/sales/report',
      title: 'General report',
      desc: 'Overview of all sales with period filters',
      icon: '📋',
      gradient: 'from-violet-600/40 via-purple-600/25 to-fuchsia-600/15',
      border: 'border-violet-400/50',
      glow: 'shadow-violet-500/30',
      ring: 'hover:ring-violet-400/40',
    },
    {
      href: '/admin/sales/profit',
      title: 'Profit report',
      desc: 'Revenue, cost and margin by product',
      icon: '💰',
      gradient: 'from-emerald-600/40 via-green-600/25 to-teal-600/15',
      border: 'border-emerald-400/50',
      glow: 'shadow-emerald-500/30',
      ring: 'hover:ring-emerald-400/40',
    },
    {
      href: '/admin/sales/credit',
      title: 'Credit report',
      desc: 'Outstanding credit · Pay on each row',
      icon: '💳',
      gradient: 'from-amber-600/40 via-orange-600/25 to-yellow-600/15',
      border: 'border-amber-400/50',
      glow: 'shadow-amber-500/30',
      ring: 'hover:ring-amber-400/40',
    },
    {
      href: '/admin/sales/debit',
      title: 'Debit',
      desc: 'Supplier credit purchases & balances',
      icon: '📥',
      gradient: 'from-rose-600/40 via-red-600/25 to-pink-600/15',
      border: 'border-rose-400/50',
      glow: 'shadow-rose-500/30',
      ring: 'hover:ring-rose-400/40',
    },
    {
      href: '/admin/sales/transactions',
      title: 'Transactions',
      desc: 'Line-by-line transaction log',
      icon: '🧾',
      gradient: 'from-sky-600/40 via-blue-600/25 to-cyan-600/15',
      border: 'border-sky-400/50',
      glow: 'shadow-sky-500/30',
      ring: 'hover:ring-sky-400/40',
    },
    {
      href: '/admin/sales/graphics',
      title: 'Graphics',
      desc: 'Charts & visual breakdown',
      icon: '📈',
      gradient: 'from-indigo-600/40 via-blue-600/25 to-violet-600/15',
      border: 'border-indigo-400/50',
      glow: 'shadow-indigo-500/30',
      ring: 'hover:ring-indigo-400/40',
    },
  ]

  const kpis = [
    {
      label: 'Recent sales',
      sub: 'last 50',
      value: String(sales.length),
      color: 'text-white',
      bar: 'from-slate-500 to-slate-700',
    },
    {
      label: 'Units sold',
      sub: 'quantity',
      value: String(totalQty),
      color: 'text-amber-300',
      bar: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Revenue',
      sub: 'total',
      value: formatMoney(totalRevenue),
      color: 'text-emerald-400',
      bar: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Credit / Cash',
      sub: 'split',
      value: `${creditSales.length} / ${cashSales.length}`,
      color: 'text-violet-300',
      bar: 'from-violet-500 to-fuchsia-600',
    },
  ]

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Dramatic ambient background — desktop only intensity */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute top-[-20%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-violet-600/20 blur-[100px] hidden md:block" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[45vh] w-[45vw] rounded-full bg-fuchsia-600/15 blur-[100px] hidden md:block" />
        <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px] hidden lg:block" />
        {/* Mobile subtle glow */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-violet-600/15 to-transparent md:hidden" />
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-5 md:px-8 py-4 sm:py-6 md:py-10 space-y-5 sm:space-y-7 md:space-y-10">
        {/* ===== HEADER ===== */}
        {/* Mobile: compact sticky-style header */}
        <header className="md:hidden">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl px-4 py-4 shadow-2xl shadow-violet-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xl shadow-lg shadow-violet-500/40">
                📊
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-white tracking-tight truncate">
                  Sales & Analysis
                </h1>
                <p className="text-[11px] text-slate-400 truncate">
                  Reports · credit · profit · charts
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop: wide cinematic header */}
        <header className="hidden md:block">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-violet-950/40 backdrop-blur-xl px-8 py-8 shadow-2xl shadow-violet-900/30 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80 mb-2">
                  Admin terminal
                </p>
                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Sales & Analysis
                </h1>
                <p className="mt-2 text-base text-slate-400 max-w-lg">
                  Full command center for revenue, credit, profit and transaction intelligence.
                </p>
              </div>
              <div className="hidden lg:flex flex-col items-end gap-1 text-right">
                <span className="text-3xl font-black text-emerald-400 tabular-nums">
                  {formatMoney(totalRevenue)}
                </span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  Recent revenue
                </span>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* ===== KPI STRIP ===== */}
        {/* Mobile: 2×2 tight cards */}
        <section className="grid grid-cols-2 gap-2.5 md:hidden">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md px-3.5 py-3.5 shadow-lg"
            >
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${k.bar}`}
              />
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {k.label}
              </p>
              <p className={`mt-1 text-lg font-bold tabular-nums leading-tight ${k.color}`}>
                {k.value}
              </p>
            </div>
          ))}
        </section>

        {/* Desktop: wide elevated KPI row */}
        <section className="hidden md:grid md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="
                group relative overflow-hidden rounded-2xl
                border border-white/10 bg-slate-900/60 backdrop-blur-md
                px-5 py-5
                shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]
                transition-all duration-300
                hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]
                hover:border-white/20
              "
            >
              <div
                className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${k.bar} opacity-80 group-hover:opacity-100 transition-opacity`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              <p className="relative text-xs font-semibold uppercase tracking-wider text-slate-500">
                {k.label}
                <span className="ml-1.5 font-normal text-slate-600 normal-case tracking-normal">
                  · {k.sub}
                </span>
              </p>
              <p
                className={`relative mt-2 text-2xl lg:text-3xl font-black tabular-nums tracking-tight ${k.color}`}
              >
                {k.value}
              </p>
            </div>
          ))}
        </section>

        {/* ===== REPORT CARDS ===== */}
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-5">
            <h2 className="text-[11px] md:text-sm font-bold uppercase tracking-[0.15em] text-slate-400">
              Reports
            </h2>
            <span className="text-[10px] md:text-xs text-slate-600 hidden sm:inline">
              Tap a card to open
            </span>
          </div>

          {/* Mobile: stacked full-width dramatic cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`
                  relative flex items-center gap-3.5 rounded-2xl border ${c.border}
                  bg-gradient-to-r ${c.gradient}
                  px-4 py-4
                  shadow-lg ${c.glow}
                  active:scale-[0.98] transition-transform
                `}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/30 border border-white/10 text-2xl">
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-[15px] leading-tight">{c.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                    {c.desc}
                  </p>
                </div>
                <span className="text-slate-500 text-lg shrink-0">›</span>
              </Link>
            ))}
          </div>

          {/* Desktop: 3-column cinematic cards with 3D lift */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`
                  group relative rounded-3xl border ${c.border}
                  bg-gradient-to-br ${c.gradient}
                  px-6 py-6 min-h-[140px]
                  shadow-xl ${c.glow}
                  ring-0 ${c.ring}
                  transition-all duration-300 ease-out
                  hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl
                  hover:ring-2
                  active:scale-[0.99]
                  overflow-hidden
                `}
              >
                {/* Shine */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />

                <div className="relative flex flex-col h-full justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span
                      className="
                        flex h-14 w-14 shrink-0 items-center justify-center
                        rounded-2xl bg-black/40 border border-white/15
                        text-3xl shadow-inner
                        group-hover:scale-110 group-hover:rotate-3
                        transition-transform duration-300
                      "
                    >
                      {c.icon}
                    </span>
                    <div>
                      <p className="font-bold text-white text-lg group-hover:text-white transition-colors">
                        {c.title}
                      </p>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-violet-300 transition-colors">
                      Open report →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== LATEST TRANSACTIONS ===== */}
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-[11px] md:text-sm font-bold uppercase tracking-[0.15em] text-slate-400">
              Latest transactions
            </h2>
            <Link
              href="/admin/sales/transactions"
              className="text-xs md:text-sm font-medium text-violet-400 hover:text-violet-300 active:text-violet-200"
            >
              View all →
            </Link>
          </div>

          {/* Mobile: card list (not table) */}
          <div className="md:hidden space-y-2">
            {sales.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-sm px-3.5 py-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">
                      {s.product_name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                      {s.product_sku ? ` · ${s.product_sku}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-emerald-400 tabular-nums text-sm">
                      {formatMoney(s.total_amount)}
                    </p>
                    <p className="text-[11px] text-slate-500">×{s.quantity}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                      (s.sale_type || '').startsWith('credit')
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-700/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-600/40'
                    }`}
                  >
                    {s.sale_type || 'cash'}
                  </span>
                </div>
              </div>
            ))}
            {sales.length === 0 && !error && (
              <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-10 text-center text-slate-500 text-sm">
                No sales recorded yet.
              </div>
            )}
          </div>

          {/* Desktop: full table */}
          <div className="hidden md:block rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40 bg-slate-900/50 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/80 text-slate-400 text-left">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">
                      Qty
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-right">
                      Total
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sales.slice(0, 10).map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-white">
                        <span className="font-medium">{s.product_name}</span>
                        {s.product_sku && (
                          <span className="text-slate-500 text-xs ml-2">
                            {s.product_sku}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-300 tabular-nums">
                        {s.quantity}
                      </td>
                      <td className="px-5 py-3.5 text-right text-emerald-400 font-bold tabular-nums">
                        {formatMoney(s.total_amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            (s.sale_type || '').startsWith('credit')
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-700/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-600/40'
                          }`}
                        >
                          {s.sale_type || 'cash'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && !error && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No sales recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
