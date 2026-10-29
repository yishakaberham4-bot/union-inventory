'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/app/actions/products'
import { getProductSalesHistory } from '@/app/actions/sales'

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

type SaleLine = {
  id: string
  quantity: number
  unit_price: number
  total_amount: number
  sale_type: string
  created_at: string
  sold_by_email?: string | null
}

export default function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const [sales, setSales] = useState<SaleLine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getProductSalesHistory(product.id, 40)
      .then((rows) => {
        if (!cancelled) setSales(rows)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [product.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const qty = Number(product.stock_qty) || 0
  const cost = Number(product.cost) || 0
  const price = Number(product.price) || 0
  const soldQty = sales.reduce((s, r) => s + r.quantity, 0)
  const soldRevenue = sales.reduce((s, r) => s + r.total_amount, 0)

  // mini sparkline from recent sales (oldest → newest for chart)
  const spark = [...sales].reverse().slice(-14)
  const maxSpark = Math.max(...spark.map((s) => s.total_amount), 1)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Blurred backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <h2 className="text-lg font-semibold text-white truncate">Product detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt=""
                className="w-20 h-20 rounded-xl object-cover border border-slate-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 text-2xl">
                📦
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-emerald-400">{product.sku}</p>
              <h3 className="text-white font-semibold text-base leading-tight">{product.name}</h3>
              {product.name_am ? (
                <p className="text-slate-400 text-sm" lang="am">
                  {product.name_am}
                </p>
              ) : null}
              <p className="text-xs text-slate-500 mt-1">
                {product.category || '—'}
                {product.unit ? ` · ${product.unit}` : ''}
                {product.barcode ? ` · 📷 ${product.barcode}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Stock</p>
              <p className="text-white font-bold tabular-nums">{formatQty(qty)}</p>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Sell price</p>
              <p className="text-emerald-400 font-bold tabular-nums">{formatMoney(price)}</p>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Cost</p>
              <p className="text-amber-300 font-bold tabular-nums">{formatMoney(cost)}</p>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
              <p className="text-[10px] uppercase text-slate-500">Cost value</p>
              <p className="text-amber-200 font-bold tabular-nums">
                {formatMoney(cost * qty)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Sales history (loaded)</span>
              <span className="text-slate-300">
                {formatQty(soldQty)} sold · {formatMoney(soldRevenue)}
              </span>
            </div>
            {spark.length > 1 && (
              <div className="h-12 flex items-end gap-0.5 mb-3">
                {spark.map((s) => (
                  <div
                    key={s.id}
                    className="flex-1 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400/80 min-h-[2px]"
                    style={{
                      height: `${Math.max(8, (s.total_amount / maxSpark) * 100)}%`,
                    }}
                    title={formatMoney(s.total_amount)}
                  />
                ))}
              </div>
            )}

            {loading ? (
              <p className="text-slate-500 text-sm py-4 text-center">Loading sales…</p>
            ) : sales.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No sales for this product yet.</p>
            ) : (
              <ul className="max-h-56 overflow-y-auto divide-y divide-slate-800">
                {sales.map((s) => (
                  <li key={s.id} className="py-2 flex justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="text-white tabular-nums">
                        {formatQty(s.quantity)} × {formatMoney(s.unit_price)}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleString()
                          : '—'}
                        {s.sale_type ? ` · ${s.sale_type}` : ''}
                      </p>
                    </div>
                    <p className="text-emerald-400 font-medium tabular-nums shrink-0">
                      {formatMoney(s.total_amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2 pb-2">
            <Link
              href={`/admin/inventory/${product.id}/edit`}
              className="flex-1 text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium"
            >
              Edit product
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
