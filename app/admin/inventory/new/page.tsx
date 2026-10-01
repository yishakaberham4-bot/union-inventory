'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createProduct } from '@/app/actions/products'

export default function NewProductPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [purchaseType, setPurchaseType] = useState<'cash' | 'credit'>('cash')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('purchase_type', purchaseType)
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
                min="0.01"
                required
                placeholder="e.g. 150.00"
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

          {/* Payment type: Cash or Credit (for stock purchase) */}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">
              Payment type <span className="text-red-400">*</span>
            </label>
            <select
              value={purchaseType}
              onChange={(e) => setPurchaseType(e.target.value as 'cash' | 'credit')}
              disabled={loading}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              How you paid the supplier for this stock. Credit items appear on the Debit page.
            </p>
          </div>

          {purchaseType === 'credit' && (
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 space-y-3">
              <p className="text-sm text-amber-200 font-medium">Credit purchase details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Supplier name</label>
                  <input
                    name="supplier_name"
                    placeholder="Supplier / vendor"
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Supplier phone</label>
                  <input
                    name="supplier_phone"
                    placeholder="Phone number"
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Outstanding = cost × stock qty. You can mark it paid later on Debit (admin password).
              </p>
            </div>
          )}

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
