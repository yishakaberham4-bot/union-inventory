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
      gradient: 'from-violet-600/30 via-purple-600/20 to-fuchsia-600/10',
      border: 'border-violet-500/40',
      glow: 'shadow-violet-500/20',
    },
    {
      href: '/admin/sales/profit',
      title: 'Profit report',
      desc: 'Revenue, cost and margin by product',
      icon: '💰',
      gradient: 'from-emerald-600/30 via-green-600/20 to-teal-600/10',
      border: 'border-emerald-500/40',
      glow: 'shadow-emerald-500/20',
    },
    {
      href: '/admin/sales/credit',
      title: 'Credit report',
      desc: 'Outstanding credit sales · Pay button on each row',
      icon: '💳',
      gradient: 'from-amber-600/30 via-orange-600/20 to-yellow-600/10',
      border: 'border-amber-500/40',
      glow: 'shadow-amber-500/20',
    },
    {
      href: '/admin/sales/debit',
      title: 'Debit',
      desc: 'Credit purchases with pay & balances',
      icon: '📥',
      gradient: 'from-rose-600/30 via-red-600/20 to-pink-600/10',
      border: 'border-rose-500/40',
      glow: 'shadow-rose-500/20',
    },
    {
      href: '/admin/sales/transactions',
      title: 'Transaction report',
      desc: 'Detailed line-by-line transaction log',
      icon: '🧾',
      gradient: 'from-sky-600/30 via-blue-600/20 to-cyan-600/10',
      border: 'border-sky-500/40',
      glow: 'shadow-sky-500/20',
    },
    {
      href: '/admin/sales/graphics',
      title: 'Graphic report',
      desc: 'Charts and visual sales breakdown',
      icon: '📈',
      gradient: 'from-indigo-600/30 via-blue-600/20 to-violet-600/10',
      border: 'border-indigo-500/40',
      glow: 'shadow-indigo-500/20',
    },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header with subtle 3D depth */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600/20 via-fuchsia-500/10 to-violet-600/20 blur-xl opacity-60" />
        <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-sm px-5 py-5 sm:px-6 sm:py-6 shadow-2xl shadow-purple-900/20">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sales & Analysis
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1.5 leading-relaxed">
            View sales activity, reports and analytics from the admin terminal.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* KPI cards — 3D elevated look */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Recent sales (50)',
            value: sales.length,
            color: 'text-white',
            accent: 'from-slate-700/50 to-slate-800/30',
          },
          {
            label: 'Units sold',
            value: totalQty,
            color: 'text-amber-300',
            accent: 'from-amber-900/30 to-slate-800/30',
          },
          {
            label: 'Revenue',
            value: formatMoney(totalRevenue),
            color: 'text-emerald-400',
            accent: 'from-emerald-900/30 to-slate-800/30',
          },
          {
            label: 'Credit / Cash',
            value: `${creditSales.length} / ${cashSales.length}`,
            color: 'text-white',
            accent: 'from-violet-900/30 to-slate-800/30',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`
              relative rounded-2xl border border-slate-700/70
              bg-gradient-to-br ${kpi.accent}
              px-4 py-4 sm:px-5 sm:py-5
              shadow-[0_8px_30px_rgb(0,0,0,0.35)]
              transform transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgb(0,0,0,0.45)]
            `}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider relative">
              {kpi.label}
            </p>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1.5 relative tabular-nums ${kpi.color}`}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Report cards — rich 3D glass cards */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-slate-400 mb-3 sm:mb-4 uppercase tracking-wider">
          Reports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`
                group relative rounded-2xl border ${c.border}
                bg-gradient-to-br ${c.gradient}
                px-4 py-5 sm:px-5 sm:py-6
                shadow-lg ${c.glow}
                transition-all duration-300
                hover:-translate-y-1 hover:scale-[1.02]
                hover:shadow-xl
                active:scale-[0.98]
              `}
            >
              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
              <div className="relative flex items-start gap-3.5">
                <span
                  className="
                    flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center
                    rounded-xl bg-slate-950/50 border border-white/10
                    text-2xl sm:text-3xl
                    shadow-inner
                    group-hover:scale-110 transition-transform duration-300
                  "
                >
                  {c.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-base sm:text-lg group-hover:text-purple-200 transition-colors">
                    {c.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-snug">
                    {c.desc}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-3 right-4 text-slate-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest transactions */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Latest transactions
          </h2>
          <Link
            href="/admin/sales/transactions"
            className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl shadow-black/30 bg-slate-900/60 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-slate-900/90 text-slate-400 text-left text-xs sm:text-sm">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-medium">Date</th>
                  <th className="px-3 sm:px-4 py-3 font-medium">Product</th>
                  <th className="px-3 sm:px-4 py-3 font-medium text-right">Qty</th>
                  <th className="px-3 sm:px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-3 sm:px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sales.slice(0, 10).map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-400 whitespace-nowrap text-xs sm:text-sm">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-white">
                      <span className="font-medium text-sm sm:text-base">
                        {s.product_name}
                      </span>
                      {s.product_sku && (
                        <span className="text-slate-500 text-[11px] sm:text-xs ml-1.5">
                          {s.product_sku}
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-slate-300 tabular-nums">
                      {s.quantity}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-emerald-400 font-semibold tabular-nums">
                      {formatMoney(s.total_amount)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium ${
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
                      className="px-4 py-10 text-center text-slate-500 text-sm"
                    >
                      No sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
