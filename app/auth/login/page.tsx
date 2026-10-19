import { redirect } from 'next/navigation'

/**
 * Email login is disabled.
 * Always send users to the Admin Terminal (Staff ID + password).
 */
export default function AuthLoginPage() {
  redirect('/admin-login')
}
