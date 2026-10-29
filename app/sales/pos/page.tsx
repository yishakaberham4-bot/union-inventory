'use client'

import Link from 'next/link'
import { logoutSales } from '@/app/actions/auth'
import LanguageToggle, { useLanguage } from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'

export default function SalesPosPage() {
  const lang = useLanguage()

  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto p-6 space-y-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center gap-3">
          <LanguageToggle />
          <div className="flex items-center justify-between w-full gap-3">
            <div className="text-center space-y-2 flex-1">
              <h1 className="text-2xl font-bold text-white">{t(lang, 'salesTerminal')}</h1>
              <p className="text-slate-400 text-sm">{t(lang, 'chooseAction')}</p>
            </div>
            <form action={logoutSales} className="shrink-0">
              <button
                type="submit"
                className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
              >
                {t(lang, 'logout')}
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link
            href="/sales/make"
            className="group rounded-2xl border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/50 p-8 text-center transition shadow-lg shadow-emerald-950/30"
          >
            <div className="text-4xl mb-3">🛒</div>
            <h2 className="text-xl font-semibold text-emerald-300 group-hover:text-emerald-200">
              {t(lang, 'makeSale')}
            </h2>
            <p className="text-sm text-slate-400 mt-2">{t(lang, 'makeSaleDesc')}</p>
          </Link>

          <Link
            href="/sales/report"
            className="group rounded-2xl border border-slate-700 bg-slate-900 hover:bg-slate-800 p-8 text-center transition"
          >
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-white group-hover:text-slate-100">
              {t(lang, 'showReport')}
            </h2>
            <p className="text-sm text-slate-400 mt-2">{t(lang, 'reportDesc')}</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
