'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/app/actions/products'
import { adjustStock } from '@/app/actions/products'

export function StockAdjustRow({ product }: { product: Product }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'set' | 'add' | 'remove'>('add')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [qty, setQty] = useState(product.stock_qty)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    setErr(null)
    const fd = new FormData()
    fd.append('id', product.id)
    fd.append('mode', mode)
    fd.append('amount', amount)
    const result = await adjustStock(fd)
    setLoading(false)
    if (result?.error) {
      setErr(result.error)
    } else if (result?.success) {
      setQty(result.stock_qty ?? qty)
      setMsg(`Stock updated to ${result.stock_qty}`)
      setAmount('')
      router.refresh()
    }
  }

  const isLow = qty <= product.low_stock_threshold

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-medium text-white">{product.name}</div>
          <div className="text-xs text-slate-500 font-mono">{product.sku}</div>
          <div className="text-sm mt-1">
            Current:{' '}
            <span className={isLow ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {qty}
            </span>
            {isLow && <span className="ml-2 text-xs text-red-400">Low stock</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Action</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'set' | 'add' | 'remove')}
              className="px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            >
              <option value="add">Add</option>
              <option value="remove">Remove</option>
              <option value="set">Set to</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Qty</label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? '…' : 'Apply'}
          </button>
        </form>
      </div>
      {msg && <p className="text-xs text-emerald-400 mt-2">{msg}</p>}
      {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
    </div>
  )
}
