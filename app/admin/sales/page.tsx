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
    },
    {
      href: '/admin/sales/profit',
      title: 'Profit report',
      desc: 'Revenue, cost and margin by product',
      icon: '💰',
    },
    {
      href: '/admin/sales/credit',
      title: 'Credit report',
      desc: 'Outstanding credit sales and customers',
      icon: '💳',
    },
    {
      href: '/admin/sales/transactions',
      title: 'Transaction report',
      desc: 'Detailed line-by-line transaction log',
      icon: '🧾',
    },
    {
      href: '/admin/sales/graphics',
      title: 'Graphic report',
      desc: 'Charts and visual sales breakdown',
      icon: '📈',
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Sales & Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">
          View sales activity, reports and analytics from the admin terminal.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Recent sales (50)</p>
          <p className="text-xl font-semibold text-white mt-0.5">{sales.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Units sold</p>
          <p className="text-xl font-semibold text-white mt-0.5">{totalQty}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-xl font-semibold text-emerald-400 mt-0.5">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Credit / Cash</p>
          <p className="text-xl font-semibold text-white mt-0.5">
            {creditSales.length} / {cashSales.length}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">Reports</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700 px-4 py-4 transition group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-medium text-white group-hover:text-purple-300">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            Latest transactions
          </h2>
          <Link
            href="/admin/sales/transactions"
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            View all →
          </Link>
        </div>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium text-right">Qty</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sales.slice(0, 10).map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-white">
                    <span className="font-medium">{s.product_name}</span>
                    {s.product_sku && (
                      <span className="text-slate-500 text-xs ml-1.5">{s.product_sku}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-300">{s.quantity}</td>
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
                </tr>
              ))}
              {sales.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No sales recorded yet.
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
