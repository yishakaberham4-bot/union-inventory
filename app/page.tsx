import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Union Inventory
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Shop Management System
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4">
          <Link
            href="/login"
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            🛍️ Sales Terminal Login
          </Link>

          <Link
            href="/admin-login"
            className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl transition border border-slate-700 flex items-center justify-center gap-2"
          >
            🛡️ Admin Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
