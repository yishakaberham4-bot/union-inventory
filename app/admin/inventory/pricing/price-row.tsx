'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/app/actions/products'
import { updatePrice } from '@/app/actions/products'

export function PriceRow({ product }: { product: Product }) {
  const router = useRouter()
  const [price, setPrice] = useState(String(product.price))
  const [cost, setCost] = useState(String(product.cost ?? 0))
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
    fd.append('price', price)
    fd.append('cost', cost)
    const result = await updatePrice(fd)
    setLoading(false)
    if (result?.error) setErr(result.error)
    else {
      setMsg('Price updated')
      router.refresh()
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-medium text-white">{product.name}</div>
          <div className="text-xs text-slate-500 font-mono">{product.sku}</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Sell price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28 px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Cost</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-28 px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
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
