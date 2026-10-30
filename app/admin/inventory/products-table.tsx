'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DeleteProductButton } from './delete-button'
import type { Product } from '@/app/actions/products'
import { useLanguage } from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'
import ProductDetailModal from './product-detail-modal'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatQty(n: number) {
  if (Number.isInteger(n)) return n.toLocaleString()
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

export default function ProductsTable({
  products,
  errorMsg,
}: {
  products: Product[]
  errorMsg: string | null
}) {
  const lang = useLanguage()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.name_am || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const totalStockQty = filtered.reduce((sum, p) => sum + (Number(p.stock_qty) || 0), 0)
  const totalSellValue = filtered.reduce(
    (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock_qty) || 0),
    0
  )
  const totalCostValue = filtered.reduce(
    (sum, p) => sum + (Number(p.cost) || 0) * (Number(p.stock_qty) || 0),
    0
  )

  const colCount = 10

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-semibold text-white">{t(lang, 'allProducts')}</h2>
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
            placeholder={t(lang, 'searchProducts')}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Summary cards */}
      {filtered.length > 0 && (
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{t(lang, 'totalQuantity')}</p>
            <p className="text-lg font-bold text-white tabular-nums mt-0.5">
              {formatQty(totalStockQty)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Stock value (sell price × qty)
            </p>
            <p className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5">
              {formatMoney(totalSellValue)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-950/30 border border-amber-800/40 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-amber-500/90">
              Purchase cost total (cost × qty)
            </p>
            <p className="text-lg font-bold text-amber-300 tabular-nums mt-0.5">
              {formatMoney(totalCostValue)}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-400">
              <th className="px-4 sm:px-6 py-3 font-medium">{t(lang, 'sku').replace(' *','')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium">{t(lang, 'name')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium">{t(lang, 'category').replace(' *','')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-right">{t(lang, 'cost')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-right">{t(lang, 'sellPrice').replace(' *','')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-right">{t(lang, 'stock')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-right">{t(lang, 'sellValue')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-right">{t(lang, 'costValue')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium">{t(lang, 'status')}</th>
              <th className="px-4 sm:px-6 py-3 font-medium text-right">{t(lang, 'actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 && !errorMsg ? (
              <tr>
                <td colSpan={colCount} className="px-6 py-12 text-center text-slate-500">
                  {search.trim() ? (
                    'No products match your search.'
                  ) : (
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
                const qty = Number(p.stock_qty) || 0
                const cost = Number(p.cost) || 0
                const price = Number(p.price) || 0
                const sellValue = price * qty
                const costValue = cost * qty
                const isLow = qty <= (Number(p.low_stock_threshold) || 0)
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <td className="px-4 sm:px-6 py-3 font-mono text-emerald-400 text-xs">
                      {p.sku}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-white font-medium">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-slate-600 text-xs">
                            —
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate max-w-[160px]" title={p.name}>
                            {p.name}
                          </div>
                          {p.name_am ? (
                            <div
                              className="text-xs text-slate-500 truncate max-w-[160px]"
                              lang="am"
                              title={p.name_am}
                            >
                              {p.name_am}
                            </div>
                          ) : null}
                          {p.unit ? (
                            <div className="text-[10px] text-slate-600 uppercase">
                              {p.unit}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-slate-400">
                      {p.category || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right text-amber-200/90 tabular-nums">
                      {formatMoney(cost)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right text-slate-300 tabular-nums">
                      {formatMoney(price)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <span
                        className={
                          isLow
                            ? 'text-red-400 font-semibold tabular-nums'
                            : 'text-white font-medium tabular-nums'
                        }
                      >
                        {formatQty(qty)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right text-emerald-400/90 tabular-nums">
                      {formatMoney(sellValue)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right text-amber-300 font-medium tabular-nums">
                      {formatMoney(costValue)}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.is_active !== false
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {p.is_active !== false ? t(lang, 'active') : t(lang, 'inactive')}
                      </span>
                    </td>
                    <td
                      className="px-4 sm:px-6 py-3 text-right space-x-2 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
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
            <tfoot className="bg-slate-950/90 border-t-2 border-slate-700">
              <tr>
                <td
                  colSpan={5}
                  className="px-4 sm:px-6 py-4 text-slate-300 font-semibold"
                >
                  Total ({filtered.length} products)
                </td>
                <td className="px-4 sm:px-6 py-4 text-right text-white font-bold tabular-nums">
                  {formatQty(totalStockQty)}
                </td>
                <td className="px-4 sm:px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-emerald-400 font-bold text-base tabular-nums">
                      {formatMoney(totalSellValue)}
                    </span>
                    <span className="text-[10px] text-slate-500">Sell × qty</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-amber-300 font-bold text-base tabular-nums">
                      {formatMoney(totalCostValue)}
                    </span>
                    <span className="text-[10px] text-slate-500">Cost × qty</span>
                  </div>
                </td>
                <td colSpan={2} className="px-4 sm:px-6 py-4" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {selected && (
        <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
