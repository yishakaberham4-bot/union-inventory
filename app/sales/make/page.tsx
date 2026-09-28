import Link from 'next/link'
import { getAvailableProductsForSale } from '@/app/actions/sales'
import MakeSaleForm from './make-sale-form'

export default async function MakeSalePage() {
  let products: Awaited<ReturnType<typeof getAvailableProductsForSale>> = []
  let loadError: string | null = null

  try {
    products = await getAvailableProductsForSale()
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load products'
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Make Sale</h1>
          <p className="text-sm text-slate-400 mt-1">
            Choose product, quantity and sale type
          </p>
        </div>
        <Link
          href="/sales/pos"
          className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          ← Back
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm space-y-2">
          <p className="font-medium">Unable to load products</p>
          <p className="text-red-300/90 text-xs">{loadError}</p>
          <p className="text-red-300/70 text-xs">
            Please try again or contact your system administrator.
          </p>
        </div>
      ) : (
        <MakeSaleForm products={products} />
      )}
    </div>
  )
}
