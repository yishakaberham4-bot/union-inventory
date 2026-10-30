'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

export type ReportFilterOptions = {
  /** Show sale type filter (cash/card/mb/credit/all) */
  showSaleType?: boolean
  /** Show payment type for transactions (all/cash/card/mb) */
  showPayment?: boolean
  /** Show bank filter when payment is mb */
  showBank?: boolean
  banks?: string[]
  /** Show product name search */
  showProductSearch?: boolean
  /** Extra hidden fields to preserve (e.g. view=returned) */
  preserve?: Record<string, string>
}

const DEFAULT_BANKS = [
  'CBE',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Coop Bank',
  'Telebirr',
  'CBE Birr',
  'M-Pesa',
  'Other',
]

function todayYMD() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function firstOfMonthYMD() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function ReportFilters({
  options = {},
}: {
  options?: ReportFilterOptions
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [from, setFrom] = useState(searchParams.get('from') || firstOfMonthYMD())
  const [to, setTo] = useState(searchParams.get('to') || todayYMD())
  const [saleType, setSaleType] = useState(searchParams.get('type') || 'all')
  const [pay, setPay] = useState(searchParams.get('pay') || 'all')
  const [bank, setBank] = useState(searchParams.get('bank') || '')
  const [q, setQ] = useState(searchParams.get('q') || '')

  function apply(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    // exclusive end = day after "to" is handled server-side; we pass inclusive to
    params.set('generated', '1')

    if (options.showSaleType && saleType && saleType !== 'all') {
      params.set('type', saleType)
    }
    if (options.showPayment && pay && pay !== 'all') {
      params.set('pay', pay)
    }
    if (options.showBank && pay === 'mb' && bank) {
      params.set('bank', bank)
    }
    if (options.showProductSearch && q.trim()) {
      params.set('q', q.trim())
    }
    if (options.preserve) {
      for (const [k, v] of Object.entries(options.preserve)) {
        if (v) params.set(k, v)
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function clearAll() {
    setFrom(firstOfMonthYMD())
    setTo(todayYMD())
    setSaleType('all')
    setPay('all')
    setBank('')
    setQ('')
    startTransition(() => {
      const params = new URLSearchParams()
      if (options.preserve) {
        for (const [k, v] of Object.entries(options.preserve)) {
          if (v) params.set(k, v)
        }
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  const banks = options.banks?.length ? options.banks : DEFAULT_BANKS

  return (
    <form
      onSubmit={apply}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-slate-300">
          Generate report — choose data &amp; date range
        </h2>
        {searchParams.get('generated') === '1' && (
          <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/50">
            Report generated
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">From date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">To date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            required
          />
        </div>

        {options.showSaleType && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sale type</label>
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All types</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mb">MB</option>
              <option value="credit">Credit</option>
            </select>
          </div>
        )}

        {options.showPayment && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Payment</label>
            <select
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mb">MB</option>
            </select>
          </div>
        )}

        {options.showBank && pay === 'mb' && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Bank (MB)</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">All banks</option>
              {banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}

        {options.showProductSearch && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Product name / SKU</label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product…"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium disabled:opacity-50 transition"
        >
          {pending ? 'Generating…' : 'Generate report'}
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition"
        >
          Reset
        </button>
        {/* Quick ranges */}
        <button
          type="button"
          onClick={() => {
            const t = todayYMD()
            setFrom(t)
            setTo(t)
          }}
          className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs transition"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            const end = new Date()
            const start = new Date()
            start.setDate(end.getDate() - 6)
            setFrom(start.toISOString().slice(0, 10))
            setTo(end.toISOString().slice(0, 10))
          }}
          className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs transition"
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => {
            setFrom(firstOfMonthYMD())
            setTo(todayYMD())
          }}
          className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-xs transition"
        >
          This month
        </button>
      </div>
    </form>
  )
}
