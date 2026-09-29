import Link from 'next/link'
import { getProducts } from '@/app/actions/products'
import ProductsTable from './products-table'


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

        <ProductsTable products={products} errorMsg={errorMsg} />

      </div>
    </div>
  )
}
