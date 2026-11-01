'use server'

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ====== CONFIG ======
// Set these in Vercel Environment Variables for production:
// NEXT_PUBLIC_WEBAUTHN_RP_ID=yourdomain.com
// NEXT_PUBLIC_WEBAUTHN_ORIGIN=https://yourdomain.com
const rpName = 'Union Inventory'
const rpID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 'localhost'
const origin = process.env.NEXT_PUBLIC_WEBAUTHN_ORIGIN || 'http://localhost:3000'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ====== REGISTRATION ======

export async function getRegistrationOptions(userId: string, userName: string) {
  const admin = getAdminClient()

  const { data: existing } = await admin
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', userId)

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(userId),
    userName,
    userDisplayName: userName,
    attestationType: 'none',
    excludeCredentials: (existing || []).map((cred) => ({
      id: cred.credential_id,
      transports: (cred.transports as AuthenticatorTransportFuture[]) || undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  })

  // Store challenge temporarily
  await admin.from('webauthn_challenges').upsert(
    {
      user_id: userId,
      challenge: options.challenge,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return options
}

export async function verifyRegistration(
  userId: string,
  response: RegistrationResponseJSON
) {
  const admin = getAdminClient()

  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('challenge')
    .eq('user_id', userId)
    .maybeSingle()

  if (!challengeRow?.challenge) {
    return { success: false, error: 'Challenge expired or not found. Please try again.' }
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    })
  } catch (err: any) {
    return { success: false, error: err?.message || 'Verification failed' }
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { success: false, error: 'Registration could not be verified' }
  }

  const { credential, credentialDeviceType } = verification.registrationInfo

  const { error } = await admin.from('webauthn_credentials').insert({
    user_id: userId,
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    device_type: credentialDeviceType,
    transports: response.response.transports || [],
  })

  // Clean up challenge
  await admin.from('webauthn_challenges').delete().eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ====== AUTHENTICATION (LOGIN) ======

export async function getAuthenticationOptions(staffId?: string) {
  const admin = getAdminClient()

  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = []

  if (staffId?.trim()) {
    const email = `${staffId.trim().toLowerCase()}@unioninventory.local`

    // Try to find user by email pattern
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const user = listData?.users?.find(
      (u) =>
        u.email?.toLowerCase() === email ||
        u.user_metadata?.staff_id?.toLowerCase() === staffId.trim().toLowerCase()
    )

    if (user) {
      const { data: creds } = await admin
        .from('webauthn_credentials')
        .select('credential_id, transports')
        .eq('user_id', user.id)

      allowCredentials = (creds || []).map((c) => ({
        id: c.credential_id,
        transports: (c.transports as AuthenticatorTransportFuture[]) || undefined,
      }))
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    userVerification: 'preferred',
  })

  // Store challenge (use a temporary key)
  const challengeKey = staffId?.trim() || `anon-${options.challenge.slice(0, 16)}`
  await admin.from('webauthn_challenges').upsert(
    {
      user_id: challengeKey,
      challenge: options.challenge,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return { options, challengeKey }
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  challengeKey: string,
  expectedRole?: 'admin' | 'sales'
) {
  const admin = getAdminClient()

  // Find the credential
  const { data: cred } = await admin
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', response.id)
    .maybeSingle()

  if (!cred) {
    return { success: false, error: 'No biometric registered for this account on this device' }
  }

  // Get challenge
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('challenge')
    .eq('user_id', challengeKey)
    .maybeSingle()

  if (!challengeRow?.challenge) {
    return { success: false, error: 'Challenge expired. Please try again.' }
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: Buffer.from(cred.public_key, 'base64url'),
        counter: Number(cred.counter),
        transports: (cred.transports as AuthenticatorTransportFuture[]) || undefined,
      },
    })
  } catch (err: any) {
    return { success: false, error: err?.message || 'Biometric authentication failed' }
  }

  if (!verification.verified) {
    return { success: false, error: 'Biometric authentication could not be verified' }
  }

  // Update counter + last used
  await admin
    .from('webauthn_credentials')
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', cred.id)

  // Clean up challenge
  await admin.from('webauthn_challenges').delete().eq('user_id', challengeKey)

  // Get the user
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(cred.user_id)
  if (userError || !userData?.user) {
    return { success: false, error: 'User not found' }
  }

  const user = userData.user

  // Check role if required
  if (expectedRole) {
    const metaRole = (user.user_metadata?.role as string) || ''
    let dbRole = ''
    try {
      const { data: row } = await admin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      dbRole = row?.role || ''
    } catch {
      // ignore
    }

    const isAdmin = metaRole === 'admin' || dbRole === 'admin'

    if (expectedRole === 'admin' && !isAdmin) {
      return {
        success: false,
        error: 'Access denied. This account does not have Admin role.',
      }
    }
    if (expectedRole === 'sales' && isAdmin) {
      return {
        success: false,
        error: 'This account is an Admin. Please use the Admin Dashboard login.',
      }
    }
  }

  // Create a session by generating a magic link and extracting the token
  // Note: For production, consider a more robust session creation method
  const email = user.email
  if (!email) {
    return { success: false, error: 'User has no email' }
  }

  // Return user id so the client can complete the login via a temporary token approach
  // We will use a short-lived custom token stored in the challenges table
  const sessionToken = crypto.randomUUID()
  await admin.from('webauthn_challenges').upsert(
    {
      user_id: `session-${sessionToken}`,
      challenge: user.id, // store user id here temporarily
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return {
    success: true,
    sessionToken,
    userId: user.id,
    role: (user.user_metadata?.role as string) || 'sales',
  }
}

/**
 * Complete the biometric login by creating a real Supabase session.
 * Called from the client after successful WebAuthn verification.
 */
export async function completeBiometricLogin(sessionToken: string) {
  const admin = getAdminClient()

  const { data: row } = await admin
    .from('webauthn_challenges')
    .select('challenge')
    .eq('user_id', `session-${sessionToken}`)
    .maybeSingle()

  if (!row?.challenge) {
    return { success: false, error: 'Session expired. Please try biometric login again.' }
  }

  const userId = row.challenge

  // Clean up
  await admin.from('webauthn_challenges').delete().eq('user_id', `session-${sessionToken}`)

  // Generate a magic link and return the hashed token so the client can set the session
  const { data: userData } = await admin.auth.admin.getUserById(userId)
  const email = userData?.user?.email
  if (!email) {
    return { success: false, error: 'User email not found' }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return { success: false, error: linkError?.message || 'Could not create session' }
  }

  return {
    success: true,
    email,
    tokenHash: linkData.properties.hashed_token,
    redirectTo:
      (userData.user?.user_metadata?.role === 'admin' ? '/admin' : '/sales/pos') as string,
  }
}
