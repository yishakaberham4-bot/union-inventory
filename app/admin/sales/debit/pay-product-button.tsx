'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { payProductCredit } from '@/app/actions/products'

export default function PayProductCreditButton({
  productId,
  productName,
  outstanding,
}: {
  productId: string
  productName: string
  outstanding: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!password.trim()) {
      setError('Enter admin password')
      return
    }
    setPending(true)
    try {
      const result = await payProductCredit(productId, password)
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      setPassword('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setPending(false)
    }
  }

  if (outstanding <= 0) {
    return (
      <span className="inline-block px-2 py-1 rounded text-xs bg-emerald-950/50 text-emerald-400">
        Paid
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setError(null)
          setPassword('')
        }}
        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white transition"
      >
        Pay
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-white">Confirm purchase payment</h3>
            <p className="text-sm text-slate-400 mt-1">
              Pay outstanding{' '}
              <span className="text-amber-300 font-medium">
                {outstanding.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>{' '}
              for <span className="text-slate-200">{productName}</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Enter your admin password to confirm.
            </p>

            <form onSubmit={handlePay} className="mt-4 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                autoFocus
                disabled={pending}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-3 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-60"
                >
                  {pending ? 'Paying…' : 'Confirm pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
