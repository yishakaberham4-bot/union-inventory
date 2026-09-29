'use client'

import { useEffect, useMemo, useState } from 'react'
import { createSale } from '@/app/actions/sales'
import { useRouter } from 'next/navigation'

type ProductOption = {
  id: string
  sku: string
  name: string
  price: number
  cost: number
  stock_qty: number
}

const BANKS = [
  'CBE',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Coop Bank',
  'Telebirr',
  'CBE Birr',
  'M-Pesa',
  'Other',
]

type SaleType = 'cash' | 'card' | 'mb' | 'credit'
type CreditMode = 'full' | 'two'

export default function MakeSaleForm({ products }: { products: ProductOption[] }) {
  const router = useRouter()
  const [productId, setProductId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productMenuOpen, setProductMenuOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [sellingPrice, setSellingPrice] = useState('')
  const [saleType, setSaleType] = useState<SaleType>('cash')
  const [bank, setBank] = useState('')
  const [otherBank, setOtherBank] = useState('')
  // Credit fields
  const [creditName, setCreditName] = useState('')
  const [creditPhone, setCreditPhone] = useState('')
  const [creditMode, setCreditMode] = useState<CreditMode>('full')
  // For two-times: how the first half is paid
  const [paidHalfType, setPaidHalfType] = useState<'cash' | 'card' | 'mb'>('cash')
  const [paidHalfBank, setPaidHalfBank] = useState('')
  const [paidHalfOtherBank, setPaidHalfOtherBank] = useState('')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, setIsPending] = useState(false)

  const selected = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  )

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    )
  }, [products, productSearch])

  useEffect(() => {
    if (selected) {
      setSellingPrice(String(selected.price))
    } else {
      setSellingPrice('')
    }
  }, [selected])

  const priceNum = parseFloat(sellingPrice)
  const total =
    selected && !isNaN(priceNum) && priceNum >= 0 ? priceNum * quantity : 0
  const halfTotal = Number((total / 2).toFixed(2))
  const maxQty = selected?.stock_qty ?? 0

  function resetForm() {
    setProductId('')
    setProductSearch('')
    setProductMenuOpen(false)
    setReason('')
    setQuantity(1)
    setSellingPrice('')
    setSaleType('cash')
    setBank('')
    setOtherBank('')
    setCreditName('')
    setCreditPhone('')
    setCreditMode('full')
    setPaidHalfType('cash')
    setPaidHalfBank('')
    setPaidHalfOtherBank('')
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)

    if (!productId) {
      setMessage({ type: 'err', text: 'Please select a product' })
      return
    }
    if (quantity < 1) {
      setMessage({ type: 'err', text: 'Quantity must be at least 1' })
      return
    }
    if (selected && quantity > selected.stock_qty) {
      setMessage({ type: 'err', text: `Only ${selected.stock_qty} in stock` })
      return
    }
    if (sellingPrice === '' || isNaN(priceNum) || priceNum < 0) {
      setMessage({ type: 'err', text: 'Enter a valid selling price (≥ 0)' })
      return
    }

    if (saleType === 'mb') {
      const bankName = bank === 'Other' ? otherBank.trim() : bank
      if (!bankName) {
        setMessage({ type: 'err', text: 'Select which bank (MB)' })
        return
      }
    }

    if (saleType === 'credit') {
      if (!creditName.trim()) {
        setMessage({ type: 'err', text: 'Enter the customer name for credit' })
        return
      }
      if (!creditPhone.trim()) {
        setMessage({ type: 'err', text: 'Enter the customer phone number for credit' })
        return
      }
      if (creditMode === 'two') {
        if (paidHalfType === 'mb') {
          const bankName =
            paidHalfBank === 'Other' ? paidHalfOtherBank.trim() : paidHalfBank
          if (!bankName) {
            setMessage({
              type: 'err',
              text: 'Select which bank for the paid half (MB)',
            })
            return
          }
        }
      }
    }

    const formData = new FormData()
    formData.set('product_id', productId)
    formData.set('quantity', String(quantity))
    formData.set('unit_price', String(priceNum))
    formData.set('sale_type', saleType)
    if (reason.trim()) {
      formData.set('reason', reason.trim())
    }

    if (saleType === 'mb') {
      formData.set('bank', bank === 'Other' ? otherBank.trim() : bank)
    }

    if (saleType === 'credit') {
      formData.set('credit_name', creditName.trim())
      formData.set('credit_phone', creditPhone.trim())
      formData.set('credit_mode', creditMode)
      if (creditMode === 'two') {
        formData.set('paid_half_type', paidHalfType)
        if (paidHalfType === 'mb') {
          formData.set(
            'paid_half_bank',
            paidHalfBank === 'Other'
              ? paidHalfOtherBank.trim()
              : paidHalfBank
          )
        }
      }
    }

    setIsPending(true)
    try {
      const result = await createSale(formData)
      if (result?.error) {
        setMessage({ type: 'err', text: result.error })
        return
      }
      setMessage({
        type: 'ok',
        text: result?.message || 'Sale completed successfully',
      })
      resetForm()
      // Soft refresh product list (stock numbers) without blocking UI
      setTimeout(() => router.refresh(), 300)
    } catch (err) {
      const text =
        err instanceof Error ? err.message : 'Sale failed. Please try again.'
      setMessage({ type: 'err', text })
    } finally {
      setIsPending(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-800/50 bg-amber-950/30 p-6 text-center text-amber-200">
        No products available for sale (all out of stock or inactive).
        Ask admin to add stock in Inventory Control.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Product
        </label>
        <input
          type="text"
          value={
            productMenuOpen
              ? productSearch
              : selected
                ? `${selected.name} (${selected.sku}) — Stock: ${selected.stock_qty}`
                : productSearch
          }
          onChange={(e) => {
            setProductSearch(e.target.value)
            setProductMenuOpen(true)
            if (productId) setProductId('')
            setMessage(null)
          }}
          onFocus={() => {
            setProductMenuOpen(true)
            if (selected) setProductSearch('')
          }}
          onBlur={() => {
            // delay so click on option registers
            setTimeout(() => setProductMenuOpen(false), 180)
          }}
          placeholder="Search product by name or SKU…"
          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          disabled={isPending}
          autoComplete="off"
        />
        {productMenuOpen && (
          <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
            {filteredProducts.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500">No products match</li>
            ) : (
              filteredProducts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-800 ${
                      productId === p.id ? 'bg-emerald-950/50 text-emerald-300' : 'text-white'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setProductId(p.id)
                      setProductSearch('')
                      setProductMenuOpen(false)
                      setQuantity(1)
                      setMessage(null)
                    }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-slate-500 ml-1.5">({p.sku})</span>
                    <span className="text-slate-400 float-right">Stock: {p.stock_qty}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {!productId && productSearch && !productMenuOpen && (
          <p className="text-xs text-amber-400 mt-1">Select a product from the list</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Reason / notes <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for this sale (e.g. air-by-air / special case)…"
          rows={2}
          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y"
          disabled={isPending}
        />
      </div>

      {selected && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Cost (ref)</p>
            <p className="text-lg font-semibold text-slate-200 mt-0.5">
              {selected.cost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">List price</p>
            <p className="text-lg font-semibold text-slate-300 mt-0.5">
              {selected.price.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">In stock</p>
            <p className="text-lg font-semibold text-white mt-0.5">
              {selected.stock_qty}
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Selling price (exact) <span className="text-red-400">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          placeholder="Enter exact selling price"
          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Quantity
        </label>
        <input
          type="number"
          min={1}
          max={maxQty || undefined}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))
          }
          className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          required
          disabled={isPending}
        />
        {selected && (
          <p className="text-xs text-slate-500 mt-1">
            Max available: {selected.stock_qty}
          </p>
        )}
      </div>

      {selected && !isNaN(priceNum) && (
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/30 px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-slate-400">Line total</span>
          <span className="text-xl font-semibold text-emerald-300">
            {total.toFixed(2)}
          </span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Sale type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { id: 'cash', label: 'Cash' },
              { id: 'card', label: 'Card' },
              { id: 'mb', label: 'MB' },
              { id: 'credit', label: 'Credit' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={isPending}
              onClick={() => {
                setSaleType(t.id)
                if (t.id !== 'mb') {
                  setBank('')
                  setOtherBank('')
                }
                if (t.id !== 'credit') {
                  setCreditName('')
                  setCreditPhone('')
                  setCreditMode('full')
                  setPaidHalfType('cash')
                  setPaidHalfBank('')
                  setPaidHalfOtherBank('')
                }
              }}
              className={`rounded-xl py-3 text-sm font-medium transition border ${
                saleType === t.id
                  ? 'bg-emerald-700 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {saleType === 'mb' && (
        <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <label className="block text-sm font-medium text-slate-300">
            Which bank? <span className="text-red-400">*</span>
          </label>
          <select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            required
            disabled={isPending}
          >
            <option value="">— Select bank —</option>
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {bank === 'Other' && (
            <input
              type="text"
              value={otherBank}
              onChange={(e) => setOtherBank(e.target.value)}
              placeholder="Type bank name"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
              disabled={isPending}
            />
          )}
        </div>
      )}

      {saleType === 'credit' && (
        <div className="space-y-4 rounded-2xl border border-amber-800/40 bg-amber-950/20 p-4">
          <p className="text-sm font-medium text-amber-200">Credit details</p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Customer name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={creditName}
              onChange={(e) => setCreditName(e.target.value)}
              placeholder="Full name of person"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Phone number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={creditPhone}
              onChange={(e) => setCreditPhone(e.target.value)}
              placeholder="e.g. 09xxxxxxxx"
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Type of credit <span className="text-red-400">*</span>
            </label>
            <select
              value={creditMode}
              onChange={(e) => setCreditMode(e.target.value as CreditMode)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              disabled={isPending}
            >
              <option value="full">Full credit</option>
              <option value="two">Two times payment (half now, half credit)</option>
            </select>
          </div>

          {creditMode === 'full' && selected && !isNaN(priceNum) && (
            <div className="rounded-xl border border-amber-700/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              Full amount <span className="font-semibold">{total.toFixed(2)}</span> will
              be saved as credit for {creditName || 'this customer'}.
            </div>
          )}

          {creditMode === 'two' && (
            <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-300">
                Half now (
                <span className="font-semibold text-emerald-300">
                  {halfTotal.toFixed(2)}
                </span>
                ), half as credit (
                <span className="font-semibold text-amber-300">
                  {halfTotal.toFixed(2)}
                </span>
                )
              </p>

              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                How is the first half paid?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'cash', label: 'Cash' },
                    { id: 'card', label: 'Card' },
                    { id: 'mb', label: 'MB' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setPaidHalfType(t.id)
                      if (t.id !== 'mb') {
                        setPaidHalfBank('')
                        setPaidHalfOtherBank('')
                      }
                    }}
                    className={`rounded-xl py-2.5 text-sm font-medium transition border ${
                      paidHalfType === t.id
                        ? 'bg-emerald-700 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {paidHalfType === 'mb' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-sm font-medium text-slate-300">
                    Which bank for paid half? <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={paidHalfBank}
                    onChange={(e) => setPaidHalfBank(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                    disabled={isPending}
                  >
                    <option value="">— Select bank —</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {paidHalfBank === 'Other' && (
                    <input
                      type="text"
                      value={paidHalfOtherBank}
                      onChange={(e) => setPaidHalfOtherBank(e.target.value)}
                      placeholder="Type bank name"
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                      disabled={isPending}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-red-950/60 border border-red-800 text-red-200'
          }`}
        >
          {message.text}
          {message.type === 'ok' && (
            <div className="mt-2">
              <a
                href="/sales/report"
                className="underline text-emerald-300 hover:text-emerald-200"
              >
                View sales report →
              </a>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !productId}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 transition shadow-lg shadow-emerald-950/40"
      >
        {isPending ? 'Processing sale…' : 'Complete Sale'}
      </button>
    </form>
  )
}
