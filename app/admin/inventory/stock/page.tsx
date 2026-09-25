import Link from 'next/link'
import { getProducts } from '@/app/actions/products'
import { StockAdjustRow } from './stock-row'

export default async function StockPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let errorMsg: string | null = null

  try {
    products = await getProducts()
  } catch (err: any) {
    errorMsg = err.message || 'Failed to load products'
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/admin/inventory" className="text-slate-400 hover:text-white text-sm">
            ← Inventory
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">Adjust stock levels</h1>
          <p className="text-slate-400 text-sm">
            Set absolute stock, or add / remove units for each product
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          {products.length === 0 && !errorMsg ? (
            <div className="text-center text-slate-500 py-12 bg-slate-900 border border-slate-800 rounded-2xl">
              No products.{' '}
              <Link href="/admin/inventory/new" className="text-emerald-400 hover:underline">
                Add one first
              </Link>
            </div>
          ) : (
            products.map((p) => <StockAdjustRow key={p.id} product={p} />)
          )}
        </div>
      </div>
    </div>
  )
}
