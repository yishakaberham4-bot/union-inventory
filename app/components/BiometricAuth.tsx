'use client'

import { useState } from 'react'
import {
  assertBiometric,
  registerBiometric,
  webauthnSupported,
} from '@/app/lib/webauthn-browser'
import {
  beginBiometricLogin,
  beginBiometricRegister,
  finishBiometricLogin,
  finishBiometricRegister,
} from '@/app/actions/webauthn'

function rpId(): string {
  if (typeof window === 'undefined') return 'localhost'
  return window.location.hostname
}

/** Register fingerprint for a staff user (use on employee's device) */
export function RegisterFingerprintButton({
  staffId,
  userId,
  displayName,
  className = '',
}: {
  staffId: string
  userId?: string
  displayName?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (!webauthnSupported()) {
    return (
      <p className="text-xs text-amber-400/90">
        This device/browser does not support fingerprint or Face ID sign-in.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy || !staffId}
        className={
          className ||
          'w-full py-2.5 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 text-sm font-medium hover:bg-slate-700 disabled:opacity-50'
        }
        onClick={async () => {
          setBusy(true)
          setMsg(null)
          setErr(null)
          try {
            const begin = await beginBiometricRegister({
              staffId,
              userId,
              displayName,
            })
            if ('error' in begin && begin.error) {
              setErr(begin.error)
              return
            }
            const reg = await registerBiometric({
              challenge: begin.challenge!,
              userId: begin.userId!,
              userName: begin.userName!,
              displayName: begin.displayName!,
              rpId: rpId(),
            })
            const fin = await finishBiometricRegister({
              credentialId: reg.credentialId,
              publicKey: reg.publicKey,
              deviceName: navigator.userAgent.slice(0, 80),
            })
            if (fin.error) setErr(fin.error)
            else setMsg(fin.message || 'Fingerprint saved')
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Registration failed')
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? 'Waiting for fingerprint…' : '👆 Register fingerprint'}
      </button>
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  )
}

/** Sign in with fingerprint — Staff ID required first */
export function FingerprintLoginButton({
  staffId,
  role,
  className = '',
}: {
  staffId: string
  role: 'admin' | 'sales'
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!webauthnSupported()) return null

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy || !staffId.trim()}
        className={
          className ||
          'w-full py-3 rounded-xl border border-emerald-700/60 bg-emerald-950/40 text-emerald-200 text-sm font-semibold hover:bg-emerald-900/50 disabled:opacity-50 flex items-center justify-center gap-2'
        }
        onClick={async () => {
          setBusy(true)
          setErr(null)
          try {
            const begin = await beginBiometricLogin(staffId)
            if ('error' in begin && begin.error) {
              setErr(begin.error)
              return
            }
            const assertion = await assertBiometric({
              challenge: begin.challenge!,
              rpId: rpId(),
              credentialIds: begin.credentialIds || [],
            })
            const fin = await finishBiometricLogin({
              credentialId: assertion.credentialId,
              role,
            })
            if (fin && 'error' in fin && fin.error) {
              setErr(fin.error)
            }
            // redirect happens on success
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Fingerprint sign-in failed')
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? (
          <>
            <span className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
            Verify fingerprint…
          </>
        ) : (
          <>👆 Sign in with fingerprint</>
        )}
      </button>
      {err && <p className="text-xs text-red-400 text-center">{err}</p>}
      <p className="text-[11px] text-slate-500 text-center">
        Enter Staff ID, then use fingerprint (or Face ID / Windows Hello)
      </p>
    </div>
  )
}
