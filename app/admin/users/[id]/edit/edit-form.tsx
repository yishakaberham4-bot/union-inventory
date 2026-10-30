'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateUser, type UserProfile } from '@/app/actions/users'

export function EditUserForm({ user }: { user: UserProfile }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateUser(user.id, formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
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
          defaultValue={user.staff_id}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white uppercase tracking-wider"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
        <input
          name="full_name"
          required
          defaultValue={user.full_name}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          New Password / PIN <span className="text-slate-500">(leave blank to keep current)</span>
        </label>
        <input
          name="password"
          type="password"
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
          defaultValue={user.role}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white"
        >
          <option value="sales">Sales Person</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
        <select
          name="is_active"
          defaultValue={user.is_active !== false ? 'true' : 'false'}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <Link
          href="/admin/users"
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
