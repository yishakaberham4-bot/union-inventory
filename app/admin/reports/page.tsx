import Link from 'next/link'

export default function ReportsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            View Reports
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1.5">
            Reports module coming soon
          </p>
        </div>

        <div className="rounded-xl border border-[var(--btn-border)] bg-[var(--btn-bg)] p-6 text-sm text-[var(--muted)]">
          Inventory, usage, and staff activity reports will appear here.
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/admin"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Back to Admin
          </Link>
          <Link
            href="/"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
