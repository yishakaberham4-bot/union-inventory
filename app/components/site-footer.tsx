'use client'

import { usePathname } from 'next/navigation'

export default function SiteFooter() {
  const pathname = usePathname() || ''
  // Hide footer on sales POS so Make Sale fills the phone screen
  if (pathname.startsWith('/sales')) {
    return null
  }

  return (
    <footer className="mt-auto w-full border-t border-slate-800/80 bg-slate-950/80 shrink-0">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-center">
        <p className="text-[11px] tracking-wide text-slate-500">
          Powered by <span className="text-slate-400 font-medium">Union</span>
        </p>
      </div>
    </footer>
  )
}
