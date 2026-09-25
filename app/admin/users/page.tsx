import Link from 'next/link'
import { getUsers } from '@/app/actions/users'
import { DeleteUserButton } from './delete-button'

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof getUsers>> = []
  let errorMsg: string | null = null

  try {
    users = await getUsers()
  } catch (err: any) {
    errorMsg = err.message || 'Failed to load users'
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin" className="text-slate-400 hover:text-white text-sm">
                ← Admin
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-white">Manage Users</h1>
            <p className="text-slate-400 text-sm">Add, edit or remove staff accounts</p>
          </div>

          <Link
            href="/admin/users/new"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-medium text-sm text-white rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New User
          </Link>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
            <strong>Error:</strong> {errorMsg}
            <p className="mt-1 text-xs text-red-300/80">
              Make sure your Supabase URL and Key are correct in .env.local and that the profiles table exists.
            </p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="px-6 py-4 font-medium">Staff ID</th>
                  <th className="px-6 py-4 font-medium">Full Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.length === 0 && !errorMsg ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No users found. Create the first one.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-mono text-emerald-400">{user.staff_id}</td>
                      <td className="px-6 py-4 text-white">{user.full_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Sales Person'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active !== false
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {user.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                        >
                          Edit
                        </Link>
                        <DeleteUserButton userId={user.id} staffId={user.staff_id} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
