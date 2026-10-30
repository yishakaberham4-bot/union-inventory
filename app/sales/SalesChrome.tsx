'use client'

import Link from 'next/link'
import { logoutSales } from '@/app/actions/auth'
import { useLanguage } from '@/app/components/LanguageToggle'
import LanguageToggle from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'

export function SalesMobileBar({ staffLabel }: { staffLabel: string }) {
  const lang = useLanguage()
  return (
    <header className="md:hidden shrink-0 border-b border-slate-800 bg-slate-900 z-30 text-[15px]">
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <Link href="/sales/pos" className="font-semibold text-white text-sm truncate">
          {t(lang, 'salesTerminal')}
        </Link>
        <nav className="flex items-center gap-1 text-xs">
          <Link
            href="/sales/make"
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium"
          >
            {t(lang, 'makeSale')}
          </Link>
          <Link
            href="/sales/report"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200"
          >
            {t(lang, 'report')}
          </Link>
          <form action={logoutSales}>
            <button type="submit" className="px-2.5 py-1.5 rounded-lg text-slate-400">
              {t(lang, 'out')}
            </button>
          </form>
        </nav>
      </div>
      <div className="px-3 pb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500 truncate">{staffLabel}</p>
        <LanguageToggle />
      </div>
    </header>
  )
}

export function SalesDesktopNav({ staffLabel }: { staffLabel: string }) {
  const lang = useLanguage()
  return (
    <header className="hidden md:block border-b border-slate-800 bg-slate-900/95 shrink-0 z-30">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/sales/pos" className="font-semibold text-white hover:text-emerald-300 shrink-0">
            {t(lang, 'salesTerminal')}
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/sales/make"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              {t(lang, 'makeSale')}
            </Link>
            <Link
              href="/sales/report"
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              {t(lang, 'report')}
            </Link>
          </nav>
          <span className="text-xs text-slate-500 truncate">{staffLabel}</span>
          <LanguageToggle />
        </div>
        <form action={logoutSales}>
          <button
            type="submit"
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
          >
            {t(lang, 'logout')}
          </button>
        </form>
      </div>
    </header>
  )
}
