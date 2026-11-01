'use client'

import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import {
  getRegistrationOptions,
  verifyRegistration,
} from '@/app/actions/webauthn'

interface Props {
  userId: string
  userName: string
  onSuccess?: () => void
  onSkip?: () => void
}

export default function RegisterBiometric({
  userId,
  userName,
  onSuccess,
  onSkip,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Get registration options from server
      const options = await getRegistrationOptions(userId, userName)

      // 2. Ask browser / device to create a new credential
      const attestation = await startRegistration({ optionsResponse: options })

      // 3. Verify + save on the server
      const result = await verifyRegistration(userId, attestation)

      if (!result.success) {
        setError(result.error || 'Registration failed')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      onSuccess?.()
    } catch (err: any) {
      console.error(err)
      if (err?.name === 'NotAllowedError') {
        setError('Biometric prompt was cancelled')
      } else if (err?.name === 'InvalidStateError') {
        setError('This authenticator is already registered')
      } else {
        setError(err?.message || 'Could not register biometric')
      }
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
        <div className="text-2xl">✅</div>
        <p className="text-emerald-400 font-medium text-sm">
          Fingerprint registered successfully!
        </p>
        <p className="text-emerald-400/70 text-xs">
          This user can now log in with biometrics on this device.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-3">
      <div className="text-center">
        <div className="text-2xl mb-1">👆</div>
        <p className="text-sm font-medium text-violet-200">
          Register Fingerprint / Biometrics
        </p>
        <p className="text-xs text-violet-300/70 mt-1">
          Optional — allows this user to log in with fingerprint or Face ID on this device.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="flex-1 py-2.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500
                     text-white text-sm font-semibold transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Waiting for fingerprint…' : 'Register Fingerprint'}
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="py-2.5 px-3 rounded-lg border border-slate-600 text-slate-300
                       text-sm hover:bg-slate-800 transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
