'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'sales'

/**
 * Schema discovered from your project:
 *
 * public.users:
 *   id, email, password_hash, role (enum: admin | user), email_verified_at, created_at, updated_at
 *
 * public.profiles:
 *   id, user_id → public.users.id, full_name, avatar_url, bio, created_at, updated_at
 *
 * staff_id is stored in Auth user_metadata (login uses staff_id@unioninventory.local).
 * App role "sales" maps to DB enum value "user".
 */
export interface UserProfile {
  id: string
  user_id?: string | null
  staff_id: string
  full_name: string
  role: UserRole | string
  is_active?: boolean | null
  avatar_url?: string | null
  bio?: string | null
  created_at?: string
  updated_at?: string
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  }
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    throw new Error(
      'Invalid API key: use the secret key (sb_secret_...), not the publishable key.'
    )
  }

  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Map app role → public.user_role enum (admin | user) */
function toDbRole(role: string): 'admin' | 'user' {
  return role === 'admin' ? 'admin' : 'user'
}

/** Map DB role → app role */
function toAppRole(dbRole: string | null | undefined): UserRole {
  return dbRole === 'admin' ? 'admin' : 'sales'
}

function friendlyError(message: string, staffId?: string): string {
  const msg = (message || '').toLowerCase()
  if (msg.includes('invalid api key')) {
    return 'Invalid API key. Use sb_secret_... in SUPABASE_SERVICE_ROLE_KEY.'
  }
  if (msg.includes('already been registered') || msg.includes('already exists') || msg.includes('duplicate')) {
    return staffId ? `Staff ID "${staffId}" is already registered` : 'User already exists'
  }
  if (msg.includes('foreign key') || msg.includes('profiles_user_id')) {
    return 'Could not link profile to user. Original: ' + message
  }
  return message || 'Request failed'
}

export async function getUsers(): Promise<UserProfile[]> {
  const admin = getAdminClient()

  // Join-ish: load profiles + users + auth metadata
  const { data: profiles, error: pErr } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (pErr) throw new Error(pErr.message)

  const { data: dbUsers } = await admin.from('users').select('id, email, role')
  const roleByUserId = new Map<string, string>()
  const emailByUserId = new Map<string, string>()
  for (const u of dbUsers || []) {
    roleByUserId.set(u.id, u.role)
    emailByUserId.set(u.id, u.email)
  }

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const metaById = new Map<string, { staff_id?: string; role?: string }>()
  for (const u of authList?.users || []) {
    const meta = (u.user_metadata || {}) as Record<string, string>
    metaById.set(u.id, { staff_id: meta.staff_id, role: meta.role })
  }

  return (profiles || []).map((p: any) => {
    const uid = p.user_id || p.id
    const meta = metaById.get(uid) || {}
    const dbRole = roleByUserId.get(uid)
    const email = emailByUserId.get(uid) || ''
    // staff_id from metadata, or derive from email prefix
    let staff_id = meta.staff_id || '—'
    if (staff_id === '—' && email.includes('@unioninventory.local')) {
      staff_id = email.split('@')[0].toUpperCase()
    }
    return {
      id: p.id,
      user_id: uid,
      staff_id,
      full_name: p.full_name || '',
      role: meta.role || toAppRole(dbRole),
      is_active: true,
      avatar_url: p.avatar_url,
      bio: p.bio,
      created_at: p.created_at,
      updated_at: p.updated_at,
    } as UserProfile
  })
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const admin = getAdminClient()

  const { data: p } = await admin
    .from('profiles')
    .select('*')
    .or(`id.eq.${id},user_id.eq.${id}`)
    .limit(1)
    .maybeSingle()

  if (!p) return null

  const uid = p.user_id || p.id
  let staff_id = '—'
  let role: UserRole | string = 'sales'

  const { data: dbUser } = await admin
    .from('users')
    .select('id, email, role')
    .eq('id', uid)
    .maybeSingle()

  if (dbUser) {
    role = toAppRole(dbUser.role)
    if (dbUser.email?.includes('@unioninventory.local')) {
      staff_id = dbUser.email.split('@')[0].toUpperCase()
    }
  }

  try {
    const { data } = await admin.auth.admin.getUserById(uid)
    const meta = (data?.user?.user_metadata || {}) as Record<string, string>
    if (meta.staff_id) staff_id = meta.staff_id
    if (meta.role) role = meta.role
  } catch {}

  return {
    id: p.id,
    user_id: uid,
    staff_id,
    full_name: p.full_name || '',
    role,
    is_active: true,
    avatar_url: p.avatar_url,
    bio: p.bio,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

export async function createUser(formData: FormData) {
  const staffId = (formData.get('staff_id') as string).trim().toUpperCase()
  const fullName = (formData.get('full_name') as string).trim()
  const password = formData.get('password') as string
  const role = formData.get('role') as UserRole

  if (!staffId || !fullName || !password || !role) {
    return { error: 'All fields are required' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const email = `${staffId.toLowerCase()}@unioninventory.local`
  const dbRole = toDbRole(role)

  let admin
  try {
    admin = getAdminClient()
  } catch (err: any) {
    return { error: err?.message || 'Admin client configuration error' }
  }

  // ── 1. Supabase Auth user (for login) ──────────────────────────
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      staff_id: staffId,
      full_name: fullName,
      role,
    },
  })

  if (authError) {
    return { error: friendlyError(authError.message, staffId) }
  }

  const userId = authData?.user?.id
  if (!userId) {
    return { error: 'Auth user created but no id returned' }
  }

  // ── 2. public.users (required — profiles.user_id FK points here) ─
  const { error: usersError } = await admin.from('users').insert({
    id: userId, // same id as Auth user so everything links
    email,
    role: dbRole,
    email_verified_at: new Date().toISOString(),
  })

  if (usersError) {
    try {
      await admin.auth.admin.deleteUser(userId)
    } catch {}
    return { error: friendlyError(usersError.message, staffId) }
  }

  // ── 3. public.profiles ─────────────────────────────────────────
  const { error: profileError } = await admin.from('profiles').insert({
    id: randomUUID(),
    user_id: userId,
    full_name: fullName,
  })

  if (profileError) {
    try {
      await admin.from('users').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
    } catch {}
    return { error: friendlyError(profileError.message, staffId) }
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function updateUser(id: string, formData: FormData) {
  const staffId = (formData.get('staff_id') as string).trim().toUpperCase()
  const fullName = (formData.get('full_name') as string).trim()
  const role = formData.get('role') as UserRole
  const newPassword = formData.get('password') as string

  if (!staffId || !fullName) {
    return { error: 'Required fields missing' }
  }

  let admin
  try {
    admin = getAdminClient()
  } catch (err: any) {
    return { error: err?.message || 'Admin client configuration error' }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, user_id')
    .or(`id.eq.${id},user_id.eq.${id}`)
    .limit(1)
    .maybeSingle()

  const authUserId = profile?.user_id || id
  const email = `${staffId.toLowerCase()}@unioninventory.local`
  const dbRole = toDbRole(role || 'sales')

  // profiles
  await admin
    .from('profiles')
    .update({ full_name: fullName })
    .or(`id.eq.${id},user_id.eq.${id}`)

  // public.users
  await admin
    .from('users')
    .update({ email, role: dbRole })
    .eq('id', authUserId)

  // Auth
  const updatePayload: any = {
    email,
    user_metadata: {
      staff_id: staffId,
      full_name: fullName,
      ...(role ? { role } : {}),
    },
  }
  if (newPassword && newPassword.length >= 6) {
    updatePayload.password = newPassword
  }

  try {
    await admin.auth.admin.updateUserById(authUserId, updatePayload)
  } catch (err: any) {
    console.warn('Could not update auth user:', err.message)
  }

  revalidatePath('/admin/users')
  redirect('/admin/users')
}

export async function deleteUser(id: string) {
  let admin
  try {
    admin = getAdminClient()
  } catch (err: any) {
    return { error: err?.message || 'Admin client configuration error' }
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, user_id')
    .or(`id.eq.${id},user_id.eq.${id}`)
    .limit(1)
    .maybeSingle()

  const authUserId = profile?.user_id || id

  // profiles first (FK)
  await admin.from('profiles').delete().or(`id.eq.${id},user_id.eq.${id}`)
  // public.users
  await admin.from('users').delete().eq('id', authUserId)
  // Auth
  try {
    await admin.auth.admin.deleteUser(authUserId)
  } catch (err: any) {
    console.warn('Could not delete auth user:', err.message)
  }

  revalidatePath('/admin/users')
  return { success: true }
}
