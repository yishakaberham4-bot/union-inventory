'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration')
  }
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function randomChallenge(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let str = ''
  bytes.forEach((b) => {
    str += String.fromCharCode(b)
  })
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function staffEmail(staffId: string) {
  return `${staffId.trim().toLowerCase()}@unioninventory.local`
}

/** Start registration — call on employee device after user is created */
export async function beginBiometricRegister(input: {
  staffId: string
  userId?: string
  displayName?: string
}) {
  const staffId = String(input.staffId || '').trim().toUpperCase()
  if (!staffId) return { error: 'Staff ID required' }

  const admin = getAdminClient()
  let userId = input.userId || ''
  let displayName = input.displayName || staffId

  if (!userId) {
    const email = staffEmail(staffId)
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const found = list?.users?.find(
      (u) =>
        u.email?.toLowerCase() === email ||
        (u.user_metadata?.staff_id as string)?.toUpperCase() === staffId
    )
    if (!found) return { error: 'User not found. Create the user first.' }
    userId = found.id
    displayName =
      (found.user_metadata?.full_name as string) || displayName
  }

  const challenge = randomChallenge()
  const jar = await cookies()
  jar.set('wa_reg_challenge', challenge, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })
  jar.set('wa_reg_staff', staffId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })
  jar.set('wa_reg_uid', userId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  // user.id for WebAuthn must be stable bytes — use userId hex-ish base64url
  const userIdB64 = Buffer.from(userId).toString('base64url')

  return {
    challenge,
    userId: userIdB64,
    userName: staffId,
    displayName,
  }
}

export async function finishBiometricRegister(input: {
  credentialId: string
  publicKey?: string
  deviceName?: string
}) {
  const jar = await cookies()
  const staffId = jar.get('wa_reg_staff')?.value
  const userId = jar.get('wa_reg_uid')?.value
  if (!staffId || !userId) {
    return { error: 'Registration session expired. Try again.' }
  }
  if (!input.credentialId) return { error: 'Missing credential' }

  const admin = getAdminClient()
  const { error } = await admin.from('webauthn_credentials').upsert(
    {
      user_id: userId,
      staff_id: staffId,
      credential_id: input.credentialId,
      public_key: input.publicKey || null,
      device_name: input.deviceName || 'This device',
    },
    { onConflict: 'credential_id' }
  )

  jar.delete('wa_reg_challenge')
  jar.delete('wa_reg_staff')
  jar.delete('wa_reg_uid')

  if (error) {
    const msg = error.message || ''
    if (msg.toLowerCase().includes('relation') || msg.includes('webauthn')) {
      return {
        error:
          'Run CREATE_WEBAUTHN.sql in Supabase SQL Editor, then try again.',
      }
    }
    return { error: msg }
  }

  return { success: true, message: 'Fingerprint registered for ' + staffId }
}

/** Start login — staffId identifies which credentials to allow */
export async function beginBiometricLogin(staffIdRaw: string) {
  const staffId = String(staffIdRaw || '').trim().toUpperCase()
  if (!staffId) return { error: 'Enter Staff ID first' }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('webauthn_credentials')
    .select('credential_id')
    .eq('staff_id', staffId)

  if (error) {
    if ((error.message || '').toLowerCase().includes('relation')) {
      return {
        error: 'Biometric table missing. Run CREATE_WEBAUTHN.sql in Supabase.',
      }
    }
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return {
      error:
        'No fingerprint registered for this Staff ID. Register on Add User or Profile first.',
    }
  }

  const challenge = randomChallenge()
  const jar = await cookies()
  jar.set('wa_login_challenge', challenge, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })
  jar.set('wa_login_staff', staffId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  return {
    challenge,
    credentialIds: data.map((r) => r.credential_id as string),
  }
}

export async function finishBiometricLogin(input: {
  credentialId: string
  role: 'admin' | 'sales'
}) {
  const jar = await cookies()
  const staffId = jar.get('wa_login_staff')?.value
  if (!staffId) return { error: 'Login session expired. Try again.' }
  if (!input.credentialId) return { error: 'Missing credential' }

  const admin = getAdminClient()
  const { data: cred } = await admin
    .from('webauthn_credentials')
    .select('user_id, staff_id, credential_id')
    .eq('credential_id', input.credentialId)
    .eq('staff_id', staffId)
    .maybeSingle()

  if (!cred) return { error: 'Fingerprint not recognized for this Staff ID' }

  // Load user and create session via temporary password bridge
  const { data: userData, error: userErr } =
    await admin.auth.admin.getUserById(cred.user_id)
  if (userErr || !userData?.user) {
    return { error: 'User account not found' }
  }

  const user = userData.user
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
    /* ignore */
  }
  const isAdmin = metaRole === 'admin' || dbRole === 'admin'

  if (input.role === 'admin' && !isAdmin) {
    return { error: 'This account is not an Admin. Use Sales login.' }
  }
  if (input.role === 'sales' && isAdmin) {
    return { error: 'This account is an Admin. Use Admin login.' }
  }

  const email = user.email || staffEmail(staffId)
  const tempPass =
    `Wa${crypto.randomUUID().replace(/-/g, '')}!aA1`

  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    password: tempPass,
  })
  if (upErr) return { error: upErr.message }

  const supabase = await createClient()
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email,
    password: tempPass,
  })

  jar.delete('wa_login_challenge')
  jar.delete('wa_login_staff')

  if (signErr) return { error: signErr.message }

  if (input.role === 'admin') {
    redirect('/admin')
  }
  redirect('/sales/pos')
}
