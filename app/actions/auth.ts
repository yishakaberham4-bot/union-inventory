'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginSalesStaff(formData: FormData) {
  const staffId = formData.get('staffId') as string
  const password = formData.get('password') as string

  // Format Staff ID into a email format if using Supabase Auth Email/Password
  // e.g., EMP-1001 -> emp-1001@unioninventory.local
  const formattedEmail = `${staffId.trim().toLowerCase()}@unioninventory.local`

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formattedEmail,
    password: password,
  })

  if (error) {
    return { error: 'Invalid Staff ID or Password' }
  }

  // Ensure this account is NOT an admin (admins must use Admin login)
  const user = data.user
  const metaRole = (user?.user_metadata?.role as string) || ''
  let dbRole = ''
  try {
    const { data: row } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle()
    dbRole = row?.role || ''
  } catch {
    // ignore
  }

  const isAdmin = metaRole === 'admin' || dbRole === 'admin'
  if (isAdmin) {
    await supabase.auth.signOut()
    return { error: 'This account is an Admin. Please use the Admin Dashboard login.' }
  }

  // Redirect sales user to terminal dashboard
  redirect('/sales/pos')
}

export async function loginAdmin(formData: FormData) {
  const staffId = formData.get('staffId') as string
  const password = formData.get('password') as string

  if (!staffId?.trim() || !password) {
    return { error: 'Staff ID and password are required' }
  }

  // Format Staff ID into email format
  // e.g., EMP-1001 -> emp-1001@unioninventory.local
  const formattedEmail = `${staffId.trim().toLowerCase()}@unioninventory.local`

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formattedEmail,
    password: password,
  })

  if (error) {
    return { error: 'Invalid Staff ID or Password' }
  }

  const user = data.user
  if (!user) {
    return { error: 'Invalid Staff ID or Password' }
  }

  // Verify admin role from user_metadata and/or public.users table
  const metaRole = (user.user_metadata?.role as string) || ''
  let dbRole = ''
  try {
    const { data: row } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    dbRole = row?.role || ''
  } catch {
    // ignore lookup errors; fall back to metadata
  }

  const isAdmin = metaRole === 'admin' || dbRole === 'admin'

  if (!isAdmin) {
    // Not an admin — sign them out immediately and reject
    await supabase.auth.signOut()
    return {
      error:
        'Access denied. This account does not have Admin role. Use Sales Terminal login instead.',
    }
  }

  // Admin authenticated — go to admin dashboard
  redirect('/admin')
}

export async function logoutAdmin() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin-login')
}

export async function logoutSales() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
