'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'union_install_dismissed'

export default function InstallPrompt() {
  const lang = useLanguage()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      /* ignore */
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true

    if (isStandalone) return

    const ua = window.navigator.userAgent || ''
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIos(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Show iOS hint after a short delay if no beforeinstallprompt
    let timer: ReturnType<typeof setTimeout> | undefined
    if (ios) {
      timer = setTimeout(() => setVisible(true), 1500)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      if (timer) clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    setDeferred(null)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    try {
      await deferred.userChoice
    } catch {
      /* ignore */
    }
    setDeferred(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 text-lg">
            ↓
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-sm">{t(lang, 'installApp')}</p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
              {isIos && !deferred
                ? 'Tap Share → Add to Home Screen'
                : t(lang, 'installHint')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {deferred ? (
            <button
              type="button"
              onClick={install}
              className="flex-1 py-2 px-3 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
            >
              {t(lang, 'installNow')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className={`py-2 px-3 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 ${
              deferred ? '' : 'flex-1'
            }`}
          >
            {t(lang, 'installDismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
