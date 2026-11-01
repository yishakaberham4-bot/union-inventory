'use client'

import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import {
  getAuthenticationOptions,
  verifyAuthentication,
  completeBiometricLogin,
} from '@/app/actions/webauthn'
import { createClient } from '@/lib/supabase/client'

interface Props {
  /** "admin" or "sales" – used for role checking */
  expectedRole: 'admin' | 'sales'
  /** Optional pre-filled Staff ID */
  staffId?: string
  className?: string
}

export default function BiometricLoginButton({
  expectedRole,
  staffId = '',
  className = '',
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBiometricLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Get authentication options from server
      const { options, challengeKey } = await getAuthenticationOptions(staffId || undefined)

      if (!options || !options.challenge) {
        setError('Could not start biometric login. Please try again.')
        setLoading(false)
        return
      }

      // 2. Ask the browser / device for biometric
      const assertion = await startAuthentication({ optionsJSON: options })

      // 3. Verify on the server
      const result = await verifyAuthentication(assertion, challengeKey, expectedRole)

      if (!result.success || !result.sessionToken) {
        setError(result.error || 'Biometric login failed')
        setLoading(false)
        return
      }

      // 4. Complete the session
      const session = await completeBiometricLogin(result.sessionToken)

      if (!session.success || !session.tokenHash || !session.email) {
        setError(session.error || 'Could not create session')
        setLoading(false)
        return
      }

      // 5. Set the Supabase session on the client
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: session.email,
        token_hash: session.tokenHash,
        type: 'magiclink',
      })

      if (verifyError) {
        setError(verifyError.message)
        setLoading(false)
        return
      }

      // 6. Redirect
      window.location.href = session.redirectTo || (expectedRole === 'admin' ? '/admin' : '/sales/pos')
    } catch (err: any) {
      console.error(err)
      if (err?.name === 'NotAllowedError') {
        setError('Biometric prompt was cancelled or timed out')
      } else if (err?.name === 'NotSupportedError') {
        setError('This device does not support biometric login')
      } else {
        setError(err?.message || 'Biometric login failed')
      }
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleBiometricLogin}
        disabled={loading}
        className={
          className ||
          `w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
           bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
           text-white font-semibold text-sm transition-all
           disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20`
        }
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Waiting for fingerprint…
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0112 23c1.759.0 3.439-.354 5-1m-6.118-6.844A13.95 13.95 0 0112 11m0 0a4 4 0 10-8 0"
              />
            </svg>
            Login with Fingerprint / Biometrics
          </>
        )}
      </button>

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
