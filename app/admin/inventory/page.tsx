import Link from 'next/link'
import { getProducts } from '@/app/actions/products'
import { DeleteProductButton } from './delete-button'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default async function InventoryPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let errorMsg: string | null = null

  try {
    products = await getProducts()
  } catch (err: any) {
    errorMsg = err.message || 'Failed to load products'
  }

  const lowCount = products.filter(
    (p) => p.stock_qty <= p.low_stock_threshold
  ).length

  const totalStockQty = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0)
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.stock_qty || 0),
    0
  )
  const totalCostValue = products.reduce(
    (sum, p) => sum + (Number(p.cost) || 0) * (p.stock_qty || 0),
    0
  )

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory Control</h1>
            <p className="text-slate-400 text-sm">
              Add products, adjust stock, update pricing, and manage low stock alerts
            </p>
          </div>
          <Link
            href="/admin/inventory/new"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-medium text-sm text-white rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            + Add Product
          </Link>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/inventory/new"
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/40 transition group"
          >
            <div className="text-2xl mb-2">➕</div>
            <h3 className="font-semibold text-white group-hover:text-emerald-400">
              Add new products
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Create SKU, name, price and initial stock
            </p>
          </Link>
          <Link
            href="/admin/inventory/stock"
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/40 transition group"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-white group-hover:text-blue-400">
              Adjust stock levels
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Set, add or remove stock quantities
            </p>
          </Link>
          <Link
            href="/admin/inventory/pricing"
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-amber-500/40 transition group"
          >
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold text-white group-hover:text-amber-400">
              Update pricing
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Change sell price and cost per product
            </p>
          </Link>
          <Link
            href="/admin/inventory/alerts"
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-red-500/40 transition group"
          >
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="font-semibold text-white group-hover:text-red-400">
              Low stock alerts
              {lowCount > 0 && (
                <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  {lowCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Products at or below threshold
            </p>
          </Link>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <p className="font-medium">Could not load products</p>
            <p className="text-red-300/80 mt-0.5">{errorMsg}</p>
            <p className="text-red-300/60 text-xs mt-1">
              Please try again or contact your system administrator.
            </p>
          </div>
        )}

        {/* Products table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">All products</h2>
            <span className="text-xs text-slate-500">{products.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium text-right">Price</th>
                  <th className="px-6 py-3 font-medium text-right">Stock</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.length === 0 && !errorMsg ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No products yet.{' '}
                      <Link href="/admin/inventory/new" className="text-emerald-400 hover:underline">
                        Add the first product
                      </Link>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.stock_qty <= p.low_stock_threshold
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-6 py-3 font-mono text-emerald-400 text-xs">
                          {p.sku}
                        </td>
                        <td className="px-6 py-3 text-white">{p.name}</td>
                        <td className="px-6 py-3 text-slate-400">{p.category || '—'}</td>
                        <td className="px-6 py-3 text-right text-white">
                          {formatMoney(p.price)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span
                            className={
                              isLow ? 'text-red-400 font-semibold' : 'text-white'
                            }
                          >
                            {p.stock_qty}
                          </span>
                          {isLow && (
                            <span className="ml-1 text-[10px] text-red-400">LOW</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.is_active !== false
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}
                          >
                            {p.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <Link
                            href={`/admin/inventory/${p.id}/edit`}
                            className="inline-flex px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                          >
                            Edit
                          </Link>
                          <DeleteProductButton productId={p.id} name={p.name} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {products.length > 0 && (
                <tfoot className="bg-slate-950/80 border-t-2 border-slate-700">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-slate-300 font-semibold"
                    >
                      Total ({products.length} products)
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 text-xs">
                      —
                    </td>
                    <td className="px-6 py-4 text-right text-white font-semibold">
                      {totalStockQty.toLocaleString()}
                    </td>
                    <td colSpan={2} className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-emerald-400 font-bold text-base">
                          {formatMoney(totalInventoryValue)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Total stock value (price × qty)
                        </span>
                        {totalCostValue > 0 && (
                          <span className="text-[11px] text-slate-500">
                            Cost value: {formatMoney(totalCostValue)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
