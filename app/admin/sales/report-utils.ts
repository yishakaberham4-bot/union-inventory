/** Shared report helpers — safe for Server Components (no 'use client') */

/** Parse from/to from searchParams into DB range (to is inclusive → exclusive next day) */
export function parseDateRange(sp: {
  from?: string
  to?: string
}): { from: string | null; to: string | null; label: string } {
  const from = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : null
  const toInclusive = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : null

  let to: string | null = null
  if (toInclusive) {
    const d = new Date(toInclusive + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    to = `${y}-${m}-${day}`
  }

  let label = 'All time'
  if (from && toInclusive) {
    label = from === toInclusive ? from : `${from} → ${toInclusive}`
  } else if (from) {
    label = `From ${from}`
  } else if (toInclusive) {
    label = `Until ${toInclusive}`
  }

  return { from, to, label }
}

export function matchSaleType(
  saleType: string | null | undefined,
  filter: string
): boolean {
  if (!filter || filter === 'all') return true
  const t = (saleType || 'cash').toLowerCase()
  if (filter === 'cash') return t === 'cash'
  if (filter === 'card') return t === 'card'
  if (filter === 'mb') return t === 'mb' || t.startsWith('mb:')
  if (filter === 'credit') return t.startsWith('credit')
  return true
}
