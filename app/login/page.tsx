'use client'

import { useState } from 'react'
import { loginSalesStaff } from '@/app/actions/auth'
import Link from 'next/link'

export default function SalesLoginPage() {
  const [staffId, setStaffId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Auto-format input to EMP-XXXX format
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

    const result = await loginSalesStaff(formData)
    if (result?.error) {
      setErrorMsg(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-xl mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 11h14l1 12H4L5 11z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Terminal Login</h1>
          <p className="text-sm text-slate-400">Union Inventory & Shop Management</p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Staff ID / Employee Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EMP-1001"
              value={staffId}
              onChange={handleStaffIdChange}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-white placeholder-slate-600 tracking-wider uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Terminal PIN / Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-white placeholder-slate-600"
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
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Access Sales Terminal'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <div>Terminal Status: <span className="text-emerald-400 font-medium">Online (POS-01)</span></div>
          <Link href="/" className="text-slate-400 hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
