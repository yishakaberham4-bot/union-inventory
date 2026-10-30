import { redirect } from 'next/navigation'

/**
 * Public email sign-up disabled.
 * Admin accounts are created from the Admin Terminal.
 */
export default function AuthSignUpPage() {
  redirect('/admin-login')
}
