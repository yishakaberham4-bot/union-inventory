'use client'

import { useState } from 'react'
import { deleteUser } from '@/app/actions/users'
import { useRouter } from 'next/navigation'

export function DeleteUserButton({ userId, staffId }: { userId: string; staffId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Delete user ${staffId}? This cannot be undone.`)) return

    setLoading(true)
    const result = await deleteUser(userId)
    setLoading(false)

    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition disabled:opacity-50"
    >
      {loading ? '...' : 'Delete'}
    </button>
  )
}
