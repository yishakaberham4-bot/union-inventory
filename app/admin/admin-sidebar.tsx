'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAdmin } from '@/app/actions/auth'
import { useLanguage } from '@/app/components/LanguageToggle'
import LanguageToggle from '@/app/components/LanguageToggle'
import { t, type TranslationKey } from '@/app/lib/i18n'

const navItems: {
  href: string
  labelKey: TranslationKey
  icon: string
  children?: { href: string; labelKey: TranslationKey }[]
}[] = [
  { href: '/admin', labelKey: 'dashboard', icon: '🏠' },
  { href: '/admin/profile', labelKey: 'profile', icon: '👤' },
  { href: '/admin/users', labelKey: 'users', icon: '👥' },
  {
    href: '/admin/inventory',
    labelKey: 'inventory',
    icon: '📦',
    children: [
      { href: '/admin/inventory', labelKey: 'allProducts' },
      { href: '/admin/inventory/new', labelKey: 'addNewProducts' },
      { href: '/admin/inventory/stock', labelKey: 'adjustStock' },
      { href: '/admin/inventory/pricing', labelKey: 'updatePricing' },
      { href: '/admin/inventory/alerts', labelKey: 'lowStockAlerts' },
    ],
  },
  {
    href: '/admin/sales',
    labelKey: 'sales',
    icon: '📊',
    children: [
      { href: '/admin/sales', labelKey: 'salesOverview' },
      { href: '/admin/sales/report', labelKey: 'generalReport' },
      { href: '/admin/sales/profit', labelKey: 'profitReport' },
      { href: '/admin/sales/credit', labelKey: 'creditReport' },
      { href: '/admin/sales/debit', labelKey: 'debit' },
      { href: '/admin/sales/transactions', labelKey: 'transactionReport' },
      { href: '/admin/sales/graphics', labelKey: 'graphicReport' },
    ],
  },
]

function ThreeLineIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex flex-col justify-center items-center w-6 h-6" aria-hidden>
      <span
        className={`block w-5 h-[2.5px] rounded-full bg-current transition-all duration-200 origin-center ${
          open ? 'translate-y-[7px] rotate-45' : ''
        }`}
      />
      <span
        className={`block w-5 h-[2.5px] rounded-full bg-current my-[4.5px] transition-all duration-200 ${
          open ? 'opacity-0 scale-x-0' : ''
        }`}
      />
      <span
        className={`block w-5 h-[2.5px] rounded-full bg-current transition-all duration-200 origin-center ${
          open ? '-translate-y-[7px] -rotate-45' : ''
        }`}
      />
    </span>
  )
}

export default function AdminSidebar({
  staffLabel,
  unreadCount = 0,
}: {
  staffLabel: string
  unreadCount?: number
}) {
  const pathname = usePathname()
  const lang = useLanguage()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Auto-expand group when on a child route
  useEffect(() => {
    const next: Record<string, boolean> = {}
    for (const item of navItems) {
      if (!item.children) continue
      const onGroup =
        pathname === item.href ||
        pathname.startsWith(item.href + '/') ||
        item.children.some(
          (c) => pathname === c.href || pathname.startsWith(c.href + '/')
        )
      if (onGroup) next[item.href] = true
    }
    setExpanded((prev) => ({ ...prev, ...next }))
  }, [pathname])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    if (href === '/admin/sales') {
      return pathname === '/admin/sales'
    }
    if (href === '/admin/inventory') {
      return pathname === '/admin/inventory'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  function toggleGroup(href: string) {
    setExpanded((prev) => ({ ...prev, [href]: !prev[href] }))
  }

  return (
    <>
      {/* Menu — left */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed top-4 left-4 z-[60] flex items-center justify-center w-11 h-11 rounded-xl border shadow-lg transition
          ${
            open
              ? 'bg-purple-600 border-purple-500 text-white'
              : 'bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-slate-500'
          }`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        <ThreeLineIcon open={open} />
      </button>

      {/* Notifications — opposite side (right) */}
      <Link
        href="/admin/notifications"
        className="fixed top-4 right-4 z-[60] flex items-center justify-center w-11 h-11 rounded-xl border shadow-lg bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 hover:border-slate-500 transition"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <span className="text-lg relative">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none border border-slate-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </Link>

      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[min(100%,20rem)] max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2">
          <div>
            <Link
              href="/admin"
              className="font-semibold text-white hover:text-purple-300"
              onClick={() => setOpen(false)}
            >
              {t(lang, 'adminTerminal')}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">{staffLabel}</p>
            <div className="mt-2"><LanguageToggle /></div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-lg bg-slate-800 text-slate-300 text-lg"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const hasChildren = !!(item.children && item.children.length)
            const isOpen = hasChildren && !!expanded[item.href]

            if (!hasChildren) {
              return (
                <Link
                  key={item.href + item.labelKey}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition ${
                    active
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-700/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-medium">{t(lang, item.labelKey)}</span>
                </Link>
              )
            }

            return (
              <div key={item.href + item.labelKey} className="space-y-0.5">
                <div className="flex items-stretch gap-1">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition min-w-0 ${
                      active
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-700/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="font-medium truncate">{t(lang, item.labelKey)}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.href)}
                    className={`w-10 rounded-xl border text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ${
                      active ? 'border-purple-700/40' : 'border-slate-800'
                    }`}
                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`inline-block transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </button>
                </div>
                {isOpen && (
                  <div className="ml-3 space-y-0.5 border-l border-slate-700 pl-3 py-1">
                    {item.children!.map((child) => {
                      const childActive =
                        pathname === child.href ||
                        (child.href !== item.href &&
                          pathname.startsWith(child.href + '/'))
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className={`block px-2.5 py-2 rounded-lg text-sm transition ${
                            childActive
                              ? 'text-purple-200 bg-purple-950/50 font-medium'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          {t(lang, child.labelKey)}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Notifications also in menu for convenience */}
          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition ${
              pathname.startsWith('/admin/notifications')
                ? 'bg-purple-600/20 text-purple-200 border border-purple-700/40'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-base">🔔</span>
            <span className="font-medium">{t(lang, 'notifications')}</span>
            {unreadCount > 0 && (
              <span className="ml-auto text-[11px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="w-full text-sm px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              {t(lang, 'logout')}
            </button>
          </form>
        </div>
      </aside>

      {/* Spacer under floating buttons */}
      <div className="h-16 shrink-0" />
    </>
  )
}
