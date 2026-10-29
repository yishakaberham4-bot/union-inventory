'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const lang = useLanguage()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    const dismissed = sessionStorage.getItem('union_install_dismissed')
    if (dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone || !visible || !deferred) return null

  return (
    <div className="fixed bottom-4 left-3 right-3 z-[100] max-w-md mx-auto rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl">
      <div className="flex gap-3 items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="w-12 h-12 rounded-xl shrink-0 border border-slate-700"
        />
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm">{t(lang, 'installApp')}</p>
          <p className="text-slate-400 text-xs mt-0.5">{t(lang, 'installHint')}</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
              onClick={async () => {
                await deferred.prompt()
                await deferred.userChoice
                setVisible(false)
                setDeferred(null)
              }}
            >
              {t(lang, 'installNow')}
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-slate-400 text-sm"
              onClick={() => {
                sessionStorage.setItem('union_install_dismissed', '1')
                setVisible(false)
              }}
            >
              {t(lang, 'installDismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
