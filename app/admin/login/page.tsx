'use client'

import { useState } from 'react'
import { loginAdmin } from '@/app/actions/auth'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [staffId, setStaffId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleStaffIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    if (val.length > 0 && !val.startsWith('EMP-')) {
      if (val.startsWith('EMP')) {
        val = 'EMP-' + val.slice(3)
      } else {
        val = 'EMP-' + val.replace(/-/g, '')
      }
    }
    setStaffId(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('staffId', staffId)
    formData.append('password', password)

    const result = await loginAdmin(formData)
    if (result?.error) {
      setErrorMsg(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 text-2xl mb-2">
            🛡️
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Admin Terminal
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in with your admin Staff ID and password
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl"
        >
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Staff ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EMP-1001"
              value={staffId}
              onChange={handleStaffIdChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white placeholder-slate-600 tracking-wider uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-white placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/20 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign in to Admin'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 space-y-2">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
