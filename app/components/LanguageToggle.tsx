'use client'

import { useEffect, useState } from 'react'
import { LANG_STORAGE_KEY, type Lang } from '@/app/lib/i18n'

type Props = {
  onChange?: (lang: Lang) => void
  className?: string
}

export default function LanguageToggle({ onChange, className = '' }: Props) {
  const [lang, setLang] = useState<Lang>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (localStorage.getItem(LANG_STORAGE_KEY) as Lang) || 'en'
    const valid: Lang = saved === 'am' ? 'am' : 'en'
    setLang(valid)
    document.documentElement.lang = valid === 'am' ? 'am' : 'en'
  }, [])

  const apply = (next: Lang) => {
    setLang(next)
    localStorage.setItem(LANG_STORAGE_KEY, next)
    document.documentElement.lang = next === 'am' ? 'am' : 'en'
    onChange?.(next)
    window.dispatchEvent(new CustomEvent('language-change', { detail: next }))
  }

  if (!mounted) {
    return (
      <div className={`flex items-center justify-center gap-2 h-9 ${className}`}>
        <div className="w-16 h-8 rounded-lg bg-slate-700/50 animate-pulse" />
        <div className="w-16 h-8 rounded-lg bg-slate-700/50 animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => apply('en')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
          lang === 'en'
            ? 'bg-emerald-600 border-emerald-500 text-white shadow-inner'
            : 'bg-transparent border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => apply('am')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
          lang === 'am'
            ? 'bg-emerald-600 border-emerald-500 text-white shadow-inner'
            : 'bg-transparent border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
        }`}
      >
        አማርኛ
      </button>
    </div>
  )
}

export function useLanguage(): Lang {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    const saved = (localStorage.getItem(LANG_STORAGE_KEY) as Lang) || 'en'
    setLang(saved === 'am' ? 'am' : 'en')
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail
      if (detail === 'am' || detail === 'en') setLang(detail)
    }
    window.addEventListener('language-change', handler)
    return () => window.removeEventListener('language-change', handler)
  }, [])

  return lang
}
