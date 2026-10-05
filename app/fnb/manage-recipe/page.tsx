'use client'

import { useState } from 'react'

type Recipe = {
  id: number
  name: string
  category: string
  ingredients: string
  portions: number
}

const initialRecipes: Recipe[] = [
  { id: 1, name: 'Chicken Alfredo', category: 'Main', ingredients: 'Chicken, pasta, cream, parmesan', portions: 4 },
  { id: 2, name: 'Caesar Salad', category: 'Starter', ingredients: 'Romaine, croutons, caesar dressing', portions: 2 },
  { id: 3, name: 'Chocolate Mousse', category: 'Dessert', ingredients: 'Dark chocolate, cream, eggs, sugar', portions: 6 },
]

export default function ManageRecipePage() {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Main')
  const [ingredients, setIngredients] = useState('')
  const [portions, setPortions] = useState(4)
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (editingId !== null) {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, name, category, ingredients, portions } : r
        )
      )
      setEditingId(null)
    } else {
      setRecipes((prev) => [
        ...prev,
        { id: Date.now(), name, category, ingredients, portions },
      ])
    }
    setName('')
    setCategory('Main')
    setIngredients('')
    setPortions(4)
  }

  const startEdit = (r: Recipe) => {
    setEditingId(r.id)
    setName(r.name)
    setCategory(r.category)
    setIngredients(r.ingredients)
    setPortions(r.portions)
  }

  const remove = (id: number) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setName('')
      setCategory('Main')
      setIngredients('')
      setPortions(4)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <section className="rounded-2xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-4 sm:p-5 space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {editingId !== null ? 'Edit Recipe' : 'Add New Recipe'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Recipe name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option>Starter</option>
                <option>Main</option>
                <option>Dessert</option>
                <option>Beverage</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Ingredients</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              placeholder="List ingredients…"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="w-28">
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Portions</label>
              <input
                type="number"
                min={1}
                value={portions}
                onChange={(e) => setPortions(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
            >
              {editingId !== null ? 'Update' : 'Add Recipe'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setName('')
                  setCategory('Main')
                  setIngredients('')
                  setPortions(4)
                }}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--btn-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--muted)] px-1">
          Recipes ({recipes.length})
        </h2>
        {recipes.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-8">No recipes yet.</p>
        ) : (
          <ul className="space-y-2">
            {recipes.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--foreground)] truncate">{r.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400 shrink-0">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{r.ingredients || '—'}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-0.5">{r.portions} portions</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(r)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-[var(--btn-border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--btn-hover)] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
