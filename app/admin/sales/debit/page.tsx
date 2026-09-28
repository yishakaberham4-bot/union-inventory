import Link from 'next/link'
import { getCreditPurchases, type Product } from '@/app/actions/products'
import PayProductCreditButton from './pay-product-button'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function outstandingOf(p: Product) {
  const credit = p.purchase_credit_amount ?? 0
  const paid = p.purchase_paid_amount ?? 0
  return Math.max(0, credit - paid)
}

export default async function AdminDebitPage() {
  let products: Product[] = []
  let error: string | null = null
  try {
    products = await getCreditPurchases()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load debit data'
  }

  const subtotalQty = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0)
  const subtotalCredit = products.reduce(
    (sum, p) => sum + (p.purchase_credit_amount ?? 0),
    0
  )
  const subtotalOutstanding = products.reduce((sum, p) => sum + outstandingOf(p), 0)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/sales" className="text-xs text-slate-500 hover:text-slate-300">
          ← Sales & Analysis
        </Link>
        <h1 className="text-2xl font-semibold text-white mt-1">Debit</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Products purchased on credit — outstanding balances to suppliers
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Open credits</p>
          <p className="text-xl font-semibold text-white mt-0.5">{products.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Units (stock)</p>
          <p className="text-xl font-semibold text-amber-300 mt-0.5">{subtotalQty}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p className="text-xs text-slate-500">Outstanding total</p>
          <p className="text-xl font-semibold text-red-300 mt-0.5">
            {formatMoney(subtotalOutstanding)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Supplier</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium text-right">Qty</th>
              <th className="px-3 py-2 font-medium text-right">Cost</th>
              <th className="px-3 py-2 font-medium text-right">Total price</th>
              <th className="px-3 py-2 font-medium text-right">Outstanding</th>
              <th className="px-3 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {products.map((p) => {
              const outstanding = outstandingOf(p)
              const unitCost = p.cost ?? 0
              return (
                <tr key={p.id} className="hover:bg-slate-900/40">
                  <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-3 py-2 text-white">
                    {p.supplier_name || '—'}
                    {p.supplier_phone && (
                      <span className="block text-xs text-slate-500">{p.supplier_phone}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {p.name}
                    {p.sku && (
                      <span className="text-slate-500 text-xs ml-1">{p.sku}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{p.stock_qty}</td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {formatMoney(unitCost)}
                  </td>
                  <td className="px-3 py-2 text-right text-amber-300">
                    {formatMoney(p.purchase_credit_amount ?? 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-red-300 font-medium">
                    {formatMoney(outstanding)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <PayProductCreditButton
                      productId={p.id}
                      productName={p.name}
                      outstanding={outstanding}
                    />
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                  No products purchased on credit.
                  <br />
                  <span className="text-xs">
                    When adding a product, choose Payment type → Credit.
                  </span>
                </td>
              </tr>
            )}
          </tbody>
          {products.length > 0 && (
            <tfoot className="bg-slate-900/90 border-t border-slate-700">
              <tr>
                <td className="px-3 py-3 text-slate-300 font-semibold" colSpan={3}>
                  Subtotal (credits)
                </td>
                <td className="px-3 py-3 text-right text-white font-semibold">
                  {subtotalQty}
                </td>
                <td className="px-3 py-3 text-right text-slate-500">—</td>
                <td className="px-3 py-3 text-right text-amber-300 font-semibold">
                  {formatMoney(subtotalCredit)}
                </td>
                <td className="px-3 py-3 text-right text-red-300 font-semibold">
                  {formatMoney(subtotalOutstanding)}
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
