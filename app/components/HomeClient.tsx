'use client'

import Link from 'next/link'
import LanguageToggle, { useLanguage } from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'

export default function HomeClient({ logoUrl }: { logoUrl: string }) {
  const lang = useLanguage()

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Union Computers & Software"
            width={200}
            height={200}
            className="object-contain drop-shadow-lg w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/icons/icon-192.png'
            }}
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t(lang, 'appName')}
          </h1>
          <p className="text-slate-400 text-sm mt-2">{t(lang, 'tagline')}</p>
        </div>

        {/* Language switch on home page */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            {t(lang, 'language')}
          </span>
          <LanguageToggle />
        </div>

        <div className="grid grid-cols-1 gap-3 pt-4">
          <Link
            href="/login"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 text-white"
          >
            {t(lang, 'salesLogin')}
          </Link>

          <Link
            href="/admin-login"
            className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl transition border border-slate-700 flex items-center justify-center gap-2 text-slate-100"
          >
            {t(lang, 'adminLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
