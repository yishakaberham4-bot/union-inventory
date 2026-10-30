'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

function todayYMD() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function firstOfMonthYMD() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function firstOfYearYMD() {
  const d = new Date()
  return `${d.getFullYear()}-01-01`
}

export default function StockReportFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const [from, setFrom] = useState(searchParams.get('from') || firstOfMonthYMD())
  const [to, setTo] = useState(searchParams.get('to') || todayYMD())
  const [mode, setMode] = useState(searchParams.get('mode') || 'add')

  function apply(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (mode && mode !== 'all') params.set('mode', mode)
    params.set('generated', '1')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function preset(kind: 'today' | 'month' | 'year') {
    const t = todayYMD()
    if (kind === 'today') {
      setFrom(t)
      setTo(t)
    } else if (kind === 'month') {
      setFrom(firstOfMonthYMD())
      setTo(t)
    } else {
      setFrom(firstOfYearYMD())
      setTo(t)
    }
  }

  return (
    <form
      onSubmit={apply}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4"
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => preset('today')}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => preset('month')}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        >
          This month
        </button>
        <button
          type="button"
          onClick={() => preset('year')}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        >
          This year
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">From date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">To date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Movement type</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="add">Added stock only</option>
            <option value="initial">Initial stock only</option>
            <option value="remove">Removed only</option>
            <option value="set">Set quantity only</option>
            <option value="all">All movements</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition disabled:opacity-50"
      >
        {pending ? 'Loading…' : 'Generate report'}
      </button>
    </form>
  )
}
