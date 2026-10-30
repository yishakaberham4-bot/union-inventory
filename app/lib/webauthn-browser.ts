/** Browser helpers for WebAuthn (fingerprint / Face ID / Windows Hello) */

function bufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ''
  bytes.forEach((b) => {
    str += String.fromCharCode(b)
  })
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return buffer
}

export function webauthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  )
}

export async function registerBiometric(options: {
  challenge: string
  userId: string
  userName: string
  displayName: string
  rpId: string
}): Promise<{ credentialId: string; publicKey: string }> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: base64urlToBuffer(options.challenge),
      rp: { name: 'Union Inventory', id: options.rpId },
      user: {
        id: base64urlToBuffer(options.userId),
        name: options.userName,
        displayName: options.displayName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 120000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null

  if (!cred) throw new Error('Biometric registration cancelled')

  const response = cred.response as AuthenticatorAttestationResponse
  return {
    credentialId: bufferToBase64url(cred.rawId),
    publicKey: bufferToBase64url(response.getPublicKey?.() || response.clientDataJSON),
  }
}

export async function assertBiometric(options: {
  challenge: string
  rpId: string
  credentialIds: string[]
}): Promise<{ credentialId: string }> {
  const allow =
    options.credentialIds.length > 0
      ? options.credentialIds.map((id) => ({
          type: 'public-key' as const,
          id: base64urlToBuffer(id),
        }))
      : undefined

  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge: base64urlToBuffer(options.challenge),
      rpId: options.rpId,
      allowCredentials: allow,
      userVerification: 'required',
      timeout: 120000,
    },
  })) as PublicKeyCredential | null

  if (!cred) throw new Error('Biometric sign-in cancelled')
  return { credentialId: bufferToBase64url(cred.rawId) }
}
