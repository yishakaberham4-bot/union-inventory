'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAdmin } from '@/app/actions/auth'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  {
    href: '/admin/inventory',
    label: 'Inventory Control',
    icon: '📦',
    children: [
      { href: '/admin/inventory/new', label: 'Add new products' },
      { href: '/admin/inventory/stock', label: 'Adjust stock levels' },
      { href: '/admin/inventory/pricing', label: 'Update pricing' },
      { href: '/admin/inventory/alerts', label: 'Low stock alerts' },
    ],
  },
  {
    href: '/admin/sales',
    label: 'Sales & Analysis',
    icon: '📊',
    children: [
      { href: '/admin/sales', label: 'Sales page' },
      { href: '/admin/sales/report', label: 'General report' },
      { href: '/admin/sales/profit', label: 'Profit report' },
      { href: '/admin/sales/credit', label: 'Credit report' },
      { href: '/admin/sales/transactions', label: 'Transaction report' },
      { href: '/admin/sales/graphics', label: 'Graphic report' },
    ],
  },
]

/** Three horizontal lines — menu button logo */
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

export default function AdminSidebar({ staffLabel }: { staffLabel: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
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
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Fixed side button — 3-line logo; opens nav list on click */}
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

      {/* Dark overlay when menu is open */}
      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      {/* Navigation list — slides in only when button is clicked */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] border-r border-slate-800 bg-slate-900 flex flex-col shadow-2xl transition-transform duration-250 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-2 pl-16">
          <div>
            <Link
              href="/admin"
              className="font-semibold text-white hover:text-purple-300 text-lg"
              onClick={() => setOpen(false)}
            >
              🛡️ Admin Terminal
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">{staffLabel}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <div key={item.href + item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition ${
                    active
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-700/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
                {item.children && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className={`block px-2 py-1.5 rounded-lg text-xs transition ${
                            childActive
                              ? 'text-purple-300 bg-purple-950/40'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="w-full text-sm px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Spacer so page content is not under the floating button */}
      <div className="h-4" />
    </>
  )
}
