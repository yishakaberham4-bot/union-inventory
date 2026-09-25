'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/app/actions/products'
import { updateLowStockThreshold } from '@/app/actions/products'

export function ThresholdRow({ product }: { product: Product }) {
  const router = useRouter()
  const [threshold, setThreshold] = useState(String(product.low_stock_threshold))
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    setErr(null)
    const fd = new FormData()
    fd.append('id', product.id)
    fd.append('low_stock_threshold', threshold)
    const result = await updateLowStockThreshold(fd)
    setLoading(false)
    if (result?.error) setErr(result.error)
    else {
      setMsg('Threshold saved')
      router.refresh()
    }
  }

  const isLow = product.stock_qty <= product.low_stock_threshold

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-medium text-white flex items-center gap-2">
            {product.name}
            {isLow && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                LOW
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Stock: {product.stock_qty} · SKU: {product.sku}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Alert when ≤</label>
            <input
              type="number"
              min="0"
              required
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-24 px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? '…' : 'Save'}
          </button>
        </form>
      </div>
      {msg && <p className="text-xs text-emerald-400 mt-2">{msg}</p>}
      {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
    </div>
  )
}
