'use client'

import { useState } from 'react'
import Link from 'next/link'
import { addUser } from '@/app/actions/users'

const ACCESS_LEVELS = [
  { value: 'fnb', label: 'F&B' },
  { value: 'purchaser', label: 'Purchaser' },
  { value: 'bar', label: 'Bar' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'store', label: 'Store' },
] as const

export default function AddUsersPage() {
  const [form, setForm] = useState({
    id: '',
    name: '',
    phone: '',
    accessLevel: '',
    password: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const result = await addUser(form)

    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      setForm({ id: '', name: '', phone: '', accessLevel: '', password: '' })
    } else {
      setMessage({ type: 'error', text: result.message })
    }

    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Add Users
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Create a new system user
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ID */}
          <div>
            <label htmlFor="id" className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              ID
            </label>
            <input
              id="id"
              name="id"
              type="text"
              value={form.id}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. EMP001"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Full name"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g. +254 7XX XXX XXX"
              required
            />
          </div>

          {/* Access Level */}
          <div>
            <label htmlFor="accessLevel" className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              Access Level
            </label>
            <select
              id="accessLevel"
              name="accessLevel"
              value={form.accessLevel}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
              required
            >
              <option value="" disabled>
                Select access level
              </option>
              {ACCESS_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[var(--muted)] mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Set a password"
              required
              minLength={6}
            />
          </div>

          {message && (
            <p
              className={`text-xs text-center ${
                message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Add User'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 pt-1">
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
