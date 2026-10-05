'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/app/actions/users'

export default function FnbLoginPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [userName, setUserName] = useState('')
  const [countdown, setCountdown] = useState(5)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await loginUser(loginId, password, 'fnb')

    if (result.success) {
      setUserName(result.name)
      // Start 5 second delay before showing welcome
      let remaining = 5
      setCountdown(remaining)

      const timer = setInterval(() => {
        remaining -= 1
        setCountdown(remaining)

        if (remaining <= 0) {
          clearInterval(timer)
          setLoading(false)
          setWelcome(true)
        }
      }, 1000)
    } else {
      setError(result.message)
      setLoading(false)
    }
  }

  // After welcome is shown, wait 5 seconds then go to F&B home
  useEffect(() => {
    if (!welcome) return

    const timer = setTimeout(() => {
      router.push('/fnb')
    }, 5000)

    return () => clearTimeout(timer)
  }, [welcome, router])

  if (welcome) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Welcome{userName ? `, ${userName}` : ''}
            </h1>
            <p className="text-lg text-emerald-500 font-medium mt-2">
              Food and Beverage Control Terminal
            </p>
            <p className="text-[var(--muted)] text-sm mt-3">
              Union Hospitality · Inventory System
            </p>
            <p className="text-xs text-[var(--muted)] mt-4 animate-pulse">
              Redirecting to F&amp;B Home…
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            F&amp;B Login
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Food &amp; Beverage Control Terminal
          </p>
        </div>

        {loading ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-12 h-12 mx-auto border-4 border-emerald-600/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-[var(--muted)] text-sm">
              Verifying credentials…
            </p>
            <p className="text-2xl font-bold text-emerald-500 tabular-nums">
              {countdown}
            </p>
            <p className="text-xs text-[var(--muted)]">
              Please wait…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Login ID
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Enter your ID"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[var(--btn-border)] bg-[var(--btn-bg)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-60"
            >
              Sign In
            </button>
          </form>
        )}

        {!loading && (
          <Link
            href="/"
            className="block text-center text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Back to home
          </Link>
        )}
      </div>
    </div>
  )
}
