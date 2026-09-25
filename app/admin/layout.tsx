import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  const metaRole = (user.user_metadata?.role as string) || ''
  let dbRole = ''
  try {
    const { data: row } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    dbRole = row?.role || ''
  } catch {
    // ignore
  }

  const isAdmin = metaRole === 'admin' || dbRole === 'admin'
  if (!isAdmin) {
    redirect('/admin-login')
  }

  const staffLabel =
    (user.user_metadata?.staff_id as string) ||
    user.email?.split('@')[0]?.toUpperCase() ||
    'Admin'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Side navigation */}
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/90 flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/admin" className="font-semibold text-white hover:text-purple-300 text-lg">
            🛡️ Admin Terminal
          </Link>
          <p className="text-xs text-slate-500 mt-1">{staffLabel}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
              {item.children && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
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

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
    </div>
  )
}
