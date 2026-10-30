'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/fnb/manage-recipe',
    label: 'Manage Recipe',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/fnb/inventory',
    label: 'Make Inventory',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: '/fnb/reports',
    label: 'F&B Reports',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/fnb/messages',
    label: 'Messages',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

export default function FnbLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Side navigation – Telegram style */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col
          w-72 max-w-[85vw]
          bg-[var(--btn-bg)] border-r border-[var(--btn-border)]
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--btn-border)] shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-[var(--btn-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className={`flex items-center gap-2 min-w-0 ${!sidebarOpen && 'lg:hidden'}`}>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">F&B</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">F&B Terminal</p>
              <p className="text-[10px] text-emerald-500 truncate">Union Hospitality</p>
            </div>
          </div>
          {/* Collapse toggle – desktop */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex ml-auto p-1.5 rounded-lg hover:bg-[var(--btn-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition"
            aria-label="Collapse sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile after selection
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidebarOpen(false)
                  }
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                  ${isActive
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-[var(--muted)] hover:bg-[var(--btn-hover)] hover:text-[var(--foreground)]'
                  }
                  ${!sidebarOpen && 'lg:justify-center lg:px-2'}
                `}
                title={!sidebarOpen ? item.label : undefined}
              >
                {item.icon}
                <span className={`${!sidebarOpen && 'lg:hidden'}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`px-3 py-3 border-t border-[var(--btn-border)] shrink-0 ${!sidebarOpen && 'lg:px-2'}`}>
          <Link
            href="/"
            className={`
              flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--muted)]
              hover:bg-[var(--btn-hover)] hover:text-[var(--foreground)] transition
              ${!sidebarOpen && 'lg:justify-center lg:px-2'}
            `}
            title={!sidebarOpen ? 'Back to home' : undefined}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
            </svg>
            <span className={`${!sidebarOpen && 'lg:hidden'}`}>Back to home</span>
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar – mobile menu + title */}
        <header className="flex items-center gap-3 h-14 px-4 border-b border-[var(--btn-border)] bg-[var(--btn-bg)]/50 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[var(--btn-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition lg:hidden"
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {navItems.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))?.label
                || 'F&B Home'}
            </p>
            <p className="text-[10px] text-[var(--muted)] truncate">Food & Beverage Control</p>
          </div>
        </header>

        {/* Center content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
