'use client'

import { useState } from 'react'

type Item = {
  id: number
  name: string
  unit: string
  quantity: number
  minStock: number
}

const initialItems: Item[] = [
  { id: 1, name: 'Chicken Breast', unit: 'kg', quantity: 12, minStock: 5 },
  { id: 2, name: 'Heavy Cream', unit: 'L', quantity: 8, minStock: 3 },
  { id: 3, name: 'Romaine Lettuce', unit: 'heads', quantity: 2, minStock: 4 },
  { id: 4, name: 'Parmesan', unit: 'kg', quantity: 1.5, minStock: 1 },
]

export default function MakeInventoryPage() {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('kg')
  const [quantity, setQuantity] = useState(0)
  const [minStock, setMinStock] = useState(1)

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setItems((prev) => [
      ...prev,
      { id: Date.now(), name, unit, quantity, minStock },
    ])
    setName('')
    setUnit('kg')
    setQuantity(0)
    setMinStock(1)
  }

  const adjustQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(0, +(i.quantity + delta).toFixed(2)) } : i
      )
    )
  }

  const remove = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const lowStock = items.filter((i) => i.quantity < i.minStock)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--foreground)]">{items.length}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Items</p>
        </div>
        <div className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 text-center">
          <p className={`text-2xl font-bold ${lowStock.length ? 'text-amber-400' : 'text-emerald-400'}`}>
            {lowStock.length}
          </p>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Low Stock</p>
        </div>
        <div className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {items.reduce((s, i) => s + i.quantity, 0).toFixed(1)}
          </p>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Total Units</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-4 sm:p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Add Inventory Item</h2>
        <form onSubmit={addItem} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Item name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. Chicken Breast"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option>kg</option>
                <option>L</option>
                <option>pcs</option>
                <option>heads</option>
                <option>boxes</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-24">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Qty</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Min stock</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
            >
              Add Item
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--muted)] px-1">Current Stock</h2>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-8">No items yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((i) => {
              const isLow = i.quantity < i.minStock
              return (
                <li
                  key={i.id}
                  className={`rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                    isLow
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-[var(--btn-border)] bg-[var(--btn-bg)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--foreground)] truncate">{i.name}</span>
                      {isLow && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0">
                          Low
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Min: {i.minStock} {i.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => adjustQty(i.id, -1)}
                      className="w-8 h-8 rounded-lg border border-[var(--btn-border)] text-[var(--muted)] hover:bg-[var(--btn-hover)] transition text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-16 text-center text-sm font-semibold tabular-nums text-[var(--foreground)]">
                      {i.quantity} <span className="text-[10px] font-normal text-[var(--muted)]">{i.unit}</span>
                    </span>
                    <button
                      onClick={() => adjustQty(i.id, 1)}
                      className="w-8 h-8 rounded-lg border border-[var(--btn-border)] text-[var(--muted)] hover:bg-[var(--btn-hover)] transition text-sm font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => remove(i.id)}
                      className="ml-1 px-2.5 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
