import Link from 'next/link'
import { getSalesReport } from '@/app/actions/sales'

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

export default async function SalesReportPage() {
  let sales: Awaited<ReturnType<typeof getSalesReport>> = []
  let loadError: string | null = null

  try {
    sales = await getSalesReport(150)
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load sales report'
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0)
  const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0)
  const totalCost = sales.reduce((sum, s) => sum + s.unit_cost * s.quantity, 0)
  const totalProfit = totalRevenue - totalCost

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Report</h1>
          <p className="text-sm text-slate-400 mt-1">Recent sales history</p>
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

      {loadError ? (
        <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm">
          {loadError}
          <p className="text-red-300/80 text-xs mt-2">
            Create the <code className="text-red-200">sales</code> table in Supabase if it does not exist (SQL is on the Make Sale page).
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          </div>

          {sales.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
              No sales yet. Make your first sale to see it here.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
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
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-300">
                            {s.sale_type?.startsWith('mb:')
                              ? `MB · ${s.sale_type.slice(3)}`
                              : s.sale_type}
                          </span>
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
