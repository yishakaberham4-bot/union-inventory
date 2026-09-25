'use client'

import { useState } from 'react'
import { deleteProduct } from '@/app/actions/products'

export function DeleteProductButton({
  productId,
  name,
}: {
  productId: string
  name: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete product "${name}"? This cannot be undone.`)) return
    setLoading(true)
    const fd = new FormData()
    fd.append('id', productId)
    await deleteProduct(fd)
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition disabled:opacity-50"
    >
      {loading ? '…' : 'Delete'}
    </button>
  )
}
