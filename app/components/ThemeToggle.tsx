'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (localStorage.getItem('theme') as Theme) || 'dark'
    setTheme(saved)
    document.documentElement.classList.toggle('dark', saved === 'dark')
    document.documentElement.classList.toggle('light', saved === 'light')
  }, [])

  const apply = (next: Theme) => {
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.classList.toggle('light', next === 'light')
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-2 h-9">
        <div className="w-20 h-8 rounded-lg bg-slate-700/50 animate-pulse" />
        <div className="w-20 h-8 rounded-lg bg-slate-700/50 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => apply('dark')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-600 text-white shadow-inner'
            : 'bg-transparent border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
        }`}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => apply('light')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
          theme === 'light'
            ? 'bg-white border-slate-300 text-slate-900 shadow-sm'
            : 'bg-transparent border-slate-600/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
        }`}
      >
        Light
      </button>
    </div>
  )
}
