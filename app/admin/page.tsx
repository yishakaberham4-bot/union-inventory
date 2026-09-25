import Link from 'next/link'

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="pb-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white">Admin Management Dashboard</h1>
          <p className="text-slate-400 text-sm">Union Inventory & Shop Management System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg">
              👥
            </div>
            <h2 className="text-lg font-semibold text-white">User Management</h2>
            <p className="text-xs text-slate-400">
              Create and manage staff accounts. Assign roles as <strong>Admin</strong> or{' '}
              <strong>Sales Person</strong>.
            </p>
            <Link
              href="/admin/users"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline font-medium inline-flex items-center gap-1"
            >
              View All Users →
            </Link>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
              📦
            </div>
            <h2 className="text-lg font-semibold text-white">Inventory Control</h2>
            <p className="text-xs text-slate-400">
              Add new products, adjust stock levels, update pricing, and set up low stock alerts.
            </p>
            <div className="flex flex-col gap-1 pt-1">
              <Link
                href="/admin/inventory"
                className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline font-medium"
              >
                Open Inventory →
              </Link>
              <Link
                href="/admin/inventory/new"
                className="text-xs text-slate-400 hover:text-white"
              >
                + Add product
              </Link>
              <Link
                href="/admin/inventory/stock"
                className="text-xs text-slate-400 hover:text-white"
              >
                Adjust stock
              </Link>
              <Link
                href="/admin/inventory/pricing"
                className="text-xs text-slate-400 hover:text-white"
              >
                Update pricing
              </Link>
              <Link
                href="/admin/inventory/alerts"
                className="text-xs text-slate-400 hover:text-white"
              >
                Low stock alerts
              </Link>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
              📊
            </div>
            <h2 className="text-lg font-semibold text-white">Sales & Analytics</h2>
            <p className="text-xs text-slate-400">
              Track real-time sales transactions, view revenue reports, and monitor cashier activity
              logs.
            </p>
            <span className="text-xs text-slate-500 font-medium">Coming Next</span>
          </div>
        </div>
      </div>
    </div>
  )
}
