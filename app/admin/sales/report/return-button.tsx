'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { returnSale } from '@/app/actions/sales'

export default function ReturnSaleButton({
  saleId,
  productName,
  quantity,
}: {
  saleId: string
  productName: string
  quantity: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    const ok = window.confirm(
      `Return ${quantity} × "${productName}" to stock?\n\nThis will:\n• Add quantity back to inventory\n• Remove this sale from all reports\n• Log it in the Returned products report`
    )
    if (!ok) return

    const reason = window.prompt('Reason for return (optional):', '') ?? ''
    setError(null)

    startTransition(async () => {
      const res = await returnSale(saleId, reason)
      if (res.error) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="px-2 py-1 rounded text-xs font-medium bg-red-950/50 text-red-300 border border-red-800/50 hover:bg-red-900/60 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
        title="Return to stock and remove from reports"
      >
        {pending ? '…' : 'Return'}
      </button>
      {error && (
        <span className="text-[10px] text-red-400 max-w-[140px] text-right leading-tight">
          {error}
        </span>
      )}
    </div>
  )
}
