import Link from 'next/link'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
} from '@/app/actions/notifications'

function typeBadge(type: string) {
  const map: Record<string, string> = {
    product_added: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
    product_edited: 'bg-sky-900/60 text-sky-300 border-sky-700/50',
    product_deleted: 'bg-red-900/60 text-red-300 border-red-700/50',
    stock_adjusted: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
    price_updated: 'bg-violet-900/60 text-violet-300 border-violet-700/50',
    other: 'bg-slate-800 text-slate-300 border-slate-600',
  }
  const label: Record<string, string> = {
    product_added: 'Added',
    product_edited: 'Edited',
    product_deleted: 'Deleted',
    stock_adjusted: 'Stock',
    price_updated: 'Price',
    other: 'Other',
  }
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full border ${
        map[type] || map.other
      }`}
    >
      {label[type] || type}
    </span>
  )
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default async function NotificationsPage() {
  const notifications = await getNotifications(100)
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🔔</span> Notifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Product and inventory changes from the admin panel
            {unread > 0 && (
              <span className="ml-2 text-amber-400 font-medium">
                · {unread} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
              >
                Mark all read
              </button>
            </form>
          )}
          <Link
            href="/admin"
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-10 text-center text-slate-400 text-sm space-y-2">
          <p className="text-4xl mb-2">🔕</p>
          <p className="font-medium text-slate-300">No notifications yet</p>
          <p className="text-xs max-w-sm mx-auto">
            When you add, edit, delete products or adjust stock/prices, entries
            appear here. If the list stays empty, run the{' '}
            <code className="text-sky-400">notifications</code> table SQL from{' '}
            <code className="text-sky-400">actions/notifications.ts</code> in
            Supabase.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 transition ${
                n.is_read
                  ? 'border-slate-800 bg-slate-900/40 opacity-80'
                  : 'border-slate-600/80 bg-slate-900/90 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeBadge(n.type)}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    )}
                    <h3 className="font-semibold text-white text-sm truncate">
                      {n.title}
                    </h3>
                  </div>
                  {n.message && (
                    <p className="text-sm text-slate-300">{n.message}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {formatWhen(n.created_at)}
                    {n.actor ? ` · ${n.actor}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.is_read && (
                    <form
                      action={async () => {
                        'use server'
                        await markNotificationRead(n.id)
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800"
                        title="Mark read"
                      >
                        ✓
                      </button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      'use server'
                      await deleteNotification(n.id)
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:text-red-300 hover:bg-slate-800"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
