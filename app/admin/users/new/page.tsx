'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createUser } from '@/app/actions/users'

export default function NewUserPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createUser(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto space-y-6">

        <div>
          <Link href="/admin/users" className="text-slate-400 hover:text-white text-sm">
            ← Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Add New User</h1>
          <p className="text-slate-400 text-sm">Create an Admin or Sales Person account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Staff ID</label>
            <input
              name="staff_id"
              required
              placeholder="EMP-1001"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-600 uppercase tracking-wider"
            />
            <p className="text-xs text-slate-500 mt-1">Will be used as login ID (e.g. EMP-1001)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              name="full_name"
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password / PIN</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
            <select
              name="role"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white"
            >
              <option value="sales">Sales Person</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <Link
              href="/admin/users"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
