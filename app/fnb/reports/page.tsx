'use client'

import { useState } from 'react'

type ReportRow = {
  id: number
  date: string
  type: string
  item: string
  quantity: string
  notes: string
}

const sampleData: ReportRow[] = [
  { id: 1, date: '2026-10-01', type: 'Usage', item: 'Chicken Breast', quantity: '4 kg', notes: 'Dinner service' },
  { id: 2, date: '2026-10-01', type: 'Receive', item: 'Heavy Cream', quantity: '10 L', notes: 'Weekly delivery' },
  { id: 3, date: '2026-10-02', type: 'Usage', item: 'Romaine Lettuce', quantity: '6 heads', notes: 'Lunch salads' },
  { id: 4, date: '2026-10-02', type: 'Waste', item: 'Parmesan', quantity: '0.2 kg', notes: 'Expired portion' },
  { id: 5, date: '2026-10-03', type: 'Usage', item: 'Chicken Breast', quantity: '5 kg', notes: 'Banquet' },
  { id: 6, date: '2026-10-03', type: 'Receive', item: 'Dark Chocolate', quantity: '3 kg', notes: 'Dessert prep' },
]

export default function FnbReportsPage() {
  const [filter, setFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filtered = sampleData.filter((r) => {
    if (filter !== 'All' && r.type !== filter) return false
    if (fromDate && r.date < fromDate) return false
    if (toDate && r.date > toDate) return false
    return true
  })

  const usageCount = sampleData.filter((r) => r.type === 'Usage').length
  const receiveCount = sampleData.filter((r) => r.type === 'Receive').length
  const wasteCount = sampleData.filter((r) => r.type === 'Waste').length

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{usageCount}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Usage</p>
        </div>
        <div className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 text-center">
          <p className="text-2xl font-bold text-sky-400">{receiveCount}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Receive</p>
        </div>
        <div className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{wasteCount}</p>
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Waste</p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-4 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Filters</h2>
        <div className="flex flex-wrap gap-2">
          {['All', 'Usage', 'Receive', 'Waste'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filter === t
                  ? 'bg-emerald-600 text-white'
                  : 'border border-[var(--btn-border)] text-[var(--muted)] hover:bg-[var(--btn-hover)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-[10px] text-[var(--muted)] mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[var(--muted)] mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          {(fromDate || toDate || filter !== 'All') && (
            <button
              onClick={() => {
                setFilter('All')
                setFromDate('')
                setToDate('')
              }}
              className="self-end px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-[var(--muted)] px-1">
          Transactions ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-8">No matching records.</p>
        ) : (
          <div className="rounded-xl border border-[var(--btn-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--btn-bg)] border-b border-[var(--btn-border)] text-left text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-3 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">Type</th>
                    <th className="px-3 py-2.5 font-medium">Item</th>
                    <th className="px-3 py-2.5 font-medium">Qty</th>
                    <th className="px-3 py-2.5 font-medium hidden sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[var(--btn-border)] last:border-0 hover:bg-[var(--btn-hover)]/50 transition"
                    >
                      <td className="px-3 py-2.5 text-[var(--muted)] whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            r.type === 'Usage'
                              ? 'bg-emerald-600/20 text-emerald-400'
                              : r.type === 'Receive'
                              ? 'bg-sky-600/20 text-sky-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--foreground)] font-medium">{r.item}</td>
                      <td className="px-3 py-2.5 text-[var(--muted)] whitespace-nowrap">{r.quantity}</td>
                      <td className="px-3 py-2.5 text-[var(--muted)] hidden sm:table-cell truncate max-w-[140px]">
                        {r.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
