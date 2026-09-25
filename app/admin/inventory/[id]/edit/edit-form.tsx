'use client'

import { useState } from 'react'
import type { Product } from '@/app/actions/products'
import { updateProduct } from '@/app/actions/products'

export function EditProductForm({ product }: { product: Product }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('id', product.id)
    const result = await updateProduct(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">SKU *</label>
          <input
            name="sku"
            required
            defaultValue={product.sku}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Category</label>
          <input
            name="category"
            defaultValue={product.category || ''}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Product name *</label>
        <input
          name="name"
          required
          defaultValue={product.name}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={product.description || ''}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Sell price *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product.price}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Cost</label>
          <input
            name="cost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product.cost ?? 0}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Stock qty *</label>
          <input
            name="stock_qty"
            type="number"
            min="0"
            required
            defaultValue={product.stock_qty}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Low stock alert</label>
          <input
            name="low_stock_threshold"
            type="number"
            min="0"
            defaultValue={product.low_stock_threshold}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={product.is_active !== false}
          className="rounded border-slate-600"
        />
        Active (available for sale)
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
