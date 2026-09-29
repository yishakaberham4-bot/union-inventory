'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DeleteProductButton } from './delete-button'
import type { Product } from '@/app/actions/products'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function ProductsTable({
  products,
  errorMsg,
}: {
  products: Product[]
  errorMsg: string | null
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const totalStockQty = filtered.reduce((sum, p) => sum + (p.stock_qty || 0), 0)
  const totalInventoryValue = filtered.reduce(
    (sum, p) => sum + (p.price || 0) * (p.stock_qty || 0),
    0
  )
  const totalCostValue = filtered.reduce(
    (sum, p) => sum + (Number(p.cost) || 0) * (p.stock_qty || 0),
    0
  )

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-white">All products</h2>
          <span className="text-xs text-slate-500">
            {filtered.length}
            {search.trim() ? ` of ${products.length}` : ''} items
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, category…"
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
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
            {filtered.length === 0 && !errorMsg ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  {search.trim()
                    ? 'No products match your search.'
                    : (
                      <>
                        No products yet.{' '}
                        <Link
                          href="/admin/inventory/new"
                          className="text-emerald-400 hover:underline"
                        >
                          Add the first product
                        </Link>
                      </>
                    )}
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isLow = p.stock_qty <= p.low_stock_threshold
                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-3 font-mono text-emerald-400 text-xs">
                      {p.sku}
                    </td>
                    <td className="px-6 py-3 text-white font-medium">{p.name}</td>
                    <td className="px-6 py-3 text-slate-400">
                      {p.category || '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-300">
                      {formatMoney(p.price)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={
                          isLow
                            ? 'text-red-400 font-semibold'
                            : 'text-white font-medium'
                        }
                      >
                        {p.stock_qty}
                      </span>
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
          {filtered.length > 0 && (
            <tfoot className="bg-slate-950/80 border-t-2 border-slate-700">
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-4 text-slate-300 font-semibold"
                >
                  Total ({filtered.length} products)
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
  )
}
