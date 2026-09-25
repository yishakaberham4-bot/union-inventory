'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createProduct } from '@/app/actions/products'

export default function NewProductPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await createProduct(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Link href="/admin/inventory" className="text-slate-400 hover:text-white text-sm">
            ← Inventory
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">Add new product</h1>
          <p className="text-slate-400 text-sm">Create a product with SKU, pricing and stock</p>
        </div>

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
                placeholder="e.g. PROD-001"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Category</label>
              <input
                name="category"
                placeholder="e.g. Beverages"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Product name *</label>
            <input
              name="name"
              required
              placeholder="Product name"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Optional"
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
                defaultValue="0"
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
                defaultValue="0"
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
                defaultValue="0"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Low stock alert</label>
              <input
                name="low_stock_threshold"
                type="number"
                min="0"
                defaultValue="5"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Create product'}
          </button>
        </form>
      </div>
    </div>
  )
}
