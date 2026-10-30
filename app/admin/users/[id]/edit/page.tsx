import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUserById } from '@/app/actions/users'
import { EditUserForm } from './edit-form'

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) notFound()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Link href="/admin/users" className="text-slate-400 hover:text-white text-sm">
            ← Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Edit User</h1>
          <p className="text-slate-400 text-sm">Update details for {user.staff_id}</p>
        </div>

        <EditUserForm user={user} />
      </div>
    </div>
  )
}
