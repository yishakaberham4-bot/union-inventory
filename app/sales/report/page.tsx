import Link from 'next/link'
import { cookies } from 'next/headers'
import { getSalesReport, type SaleRow } from '@/app/actions/sales'
import { t, type Lang, LANG_COOKIE } from '@/app/lib/i18n'
import LanguageToggle from '@/app/components/LanguageToggle'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>
}) {
  const cookieStore = await cookies()
  const lang: Lang = cookieStore.get(LANG_COOKIE)?.value === 'am' ? 'am' : 'en'

  const sp = await Promise.resolve(searchParams)
  const now = new Date()
  const todayYMD = toYMD(now)
  const yesterdayYMD = toYMD(addDays(now, -1))
  const day =
    sp.day === yesterdayYMD || sp.day === 'yesterday' ? yesterdayYMD : todayYMD
  const from = day
  const to = toYMD(addDays(new Date(day + 'T12:00:00'), 1))

  let sales: SaleRow[] = []
  let loadError: string | null = null
  try {
    sales = await getSalesReport({ limit: 2000, from, to })
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load sales'
  }

  const totalQty = sales.reduce((s, r) => s + (Number(r.quantity) || 0), 0)
  const totalRevenue = sales.reduce(
    (s, r) => s + (Number(r.total_amount) || 0),
    0
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full" lang={lang}>
      <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href="/sales/pos"
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              ← {t(lang, 'salesTerminal')}
            </Link>
            <h1 className="text-xl font-bold text-white mt-1">
              {t(lang, 'salesReport')}
            </h1>
          </div>
          <LanguageToggle />
        </div>

        <div className="flex gap-2">
          <Link
            href={`/sales/report?day=${todayYMD}`}
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition border ${
              day === todayYMD
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t(lang, 'today')}
          </Link>
          <Link
            href={`/sales/report?day=${yesterdayYMD}`}
            className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition border ${
              day === yesterdayYMD
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t(lang, 'yesterday')}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500 uppercase">{t(lang, 'itemsSold')}</p>
            <p className="text-xl font-semibold text-white mt-1 tabular-nums">{totalQty}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-500 uppercase">{t(lang, 'totalSales')}</p>
            <p className="text-xl font-semibold text-emerald-400 mt-1 tabular-nums">
              {formatMoney(totalRevenue)}
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm">
            {loadError}
          </div>
        ) : sales.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500 text-sm">
            {day === todayYMD ? t(lang, 'noSalesToday') : t(lang, 'noSalesYesterday')}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex justify-between">
              <h2 className="text-sm font-medium text-slate-300">{t(lang, 'soldProducts')}</h2>
              <span className="text-xs text-slate-500">
                {sales.length} {t(lang, 'lines')}
              </span>
            </div>
            <div className="md:hidden divide-y divide-slate-800">
              {sales.map((s) => (
                <div key={s.id} className="px-4 py-3 flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{s.product_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatTime(s.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm tabular-nums">× {s.quantity}</p>
                    <p className="text-emerald-400 font-semibold text-sm tabular-nums">
                      {formatMoney(s.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t(lang, 'product')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t(lang, 'qty')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t(lang, 'price')}</th>
                    <th className="px-4 py-3 font-medium">{t(lang, 'time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sales.map((s) => (
                    <tr key={s.id} className="bg-slate-950/50">
                      <td className="px-4 py-3 text-white font-medium">{s.product_name}</td>
                      <td className="px-4 py-3 text-right text-white tabular-nums">{s.quantity}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium tabular-nums">
                        {formatMoney(s.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatTime(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/90 border-t border-slate-700">
                  <tr>
                    <td className="px-4 py-3 text-slate-300 font-semibold">{t(lang, 'total')}</td>
                    <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">
                      {totalQty}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold tabular-nums">
                      {formatMoney(totalRevenue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
