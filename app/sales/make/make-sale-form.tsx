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
  category?: string | null
}

export type SalesChartData = {
  days: { date: string; label: string; revenue: number; count: number }[]
  todayRevenue: number
  todayCount: number
  weekRevenue: number
  weekCount: number
}

type CartItem = {
  productId: string
  name: string
  sku: string
  unitPrice: number
  cost: number
  quantity: number
  maxStock: number
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

const CATEGORY_COLORS = [
  'bg-violet-600',
  'bg-rose-500',
  'bg-slate-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-sky-500',
  'bg-red-500',
  'bg-indigo-700',
  'bg-amber-600',
  'bg-teal-600',
  'bg-pink-600',
  'bg-cyan-600',
]

const BOTTOM_ICONS: Record<string, string> = {
  Favorites: '⭐',
  All: '📦',
}

export default function MakeSaleForm({
  products,
  chart,
}: {
  products: ProductOption[]
  chart?: SalesChartData
}) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCartIndex, setSelectedCartIndex] = useState<number | null>(null)

  // Payment modal
  const [payOpen, setPayOpen] = useState(false)
  const [saleType, setSaleType] = useState<SaleType>('cash')
  const [bank, setBank] = useState('')
  const [otherBank, setOtherBank] = useState('')
  const [creditName, setCreditName] = useState('')
  const [creditPhone, setCreditPhone] = useState('')
  const [creditMode, setCreditMode] = useState<CreditMode>('full')
  const [paidHalfType, setPaidHalfType] = useState<'cash' | 'card' | 'mb'>('cash')
  const [paidHalfBank, setPaidHalfBank] = useState('')
  const [paidHalfOtherBank, setPaidHalfOtherBank] = useState('')
  const [reason, setReason] = useState('')
  const [discountPct, setDiscountPct] = useState(0)

  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [chartOpen, setChartOpen] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      const cat = (p.category || 'Uncategorized').trim() || 'Uncategorized'
      map.set(cat, (map.get(cat) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = products
    if (activeCategory) {
      list = list.filter(
        (p) => ((p.category || 'Uncategorized').trim() || 'Uncategorized') === activeCategory
      )
    }
    const q = productSearch.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, activeCategory, productSearch])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2))
  const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)))

  const chartDays = chart?.days ?? []
  const chartMaxRev = useMemo(
    () => Math.max(...chartDays.map((d) => d.revenue), 1),
    [chartDays]
  )

  function addToCart(p: ProductOption) {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === p.id)
      if (idx >= 0) {
        const existing = prev[idx]
        if (existing.quantity >= existing.maxStock) return prev
        const next = [...prev]
        next[idx] = { ...existing, quantity: existing.quantity + 1 }
        return next
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          unitPrice: p.price,
          cost: p.cost,
          quantity: 1,
          maxStock: p.stock_qty,
        },
      ]
    })
    setMessage(null)
  }

  function updateQty(index: number, qty: number) {
    setCart((prev) => {
      const next = [...prev]
      const item = next[index]
      if (!item) return prev
      const q = Math.max(1, Math.min(item.maxStock, qty))
      next[index] = { ...item, quantity: q }
      return next
    })
  }

  function updateUnitPrice(index: number, price: number) {
    setCart((prev) => {
      const next = [...prev]
      const item = next[index]
      if (!item) return prev
      const p = Number.isFinite(price) && price >= 0 ? price : 0
      next[index] = { ...item, unitPrice: p }
      return next
    })
  }

  function addFromDropdown(productId: string) {
    if (!productId) return
    const p = products.find((x) => x.id === productId)
    if (p) addToCart(p)
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index))
    if (selectedCartIndex === index) setSelectedCartIndex(null)
    else if (selectedCartIndex != null && selectedCartIndex > index) {
      setSelectedCartIndex(selectedCartIndex - 1)
    }
  }

  function clearCart() {
    setCart([])
    setSelectedCartIndex(null)
    setDiscountPct(0)
    setReason('')
  }

  function resetPayment() {
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

  function showSaleNotification(info: { lines: number; total: number }) {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const title = 'Sale completed'
    const body = `${info.lines} item(s)\nTotal: ${info.total.toFixed(2)}`
    const options: NotificationOptions = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'sale-notification',
      requireInteraction: false,
    }
    const show = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready
          if (reg?.showNotification) {
            await reg.showNotification(title, options)
            return
          }
        }
        new Notification(title, options)
      } catch {
        /* ignore */
      }
    }
    if (Notification.permission === 'granted') void show()
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') void show()
      })
    }
  }

  async function completeSale() {
    if (cart.length === 0) {
      setMessage({ type: 'err', text: 'Cart is empty' })
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
      if (creditMode === 'two' && paidHalfType === 'mb') {
        const bankName =
          paidHalfBank === 'Other' ? paidHalfOtherBank.trim() : paidHalfBank
        if (!bankName) {
          setMessage({ type: 'err', text: 'Select which bank for the paid half (MB)' })
          return
        }
      }
    }

    // Apply discount proportionally to unit prices when needed
    const factor = subtotal > 0 ? total / subtotal : 1

    setIsPending(true)
    setMessage(null)
    let successCount = 0
    const errors: string[] = []

    try {
      for (const item of cart) {
        const adjustedPrice = Number((item.unitPrice * factor).toFixed(2))
        const formData = new FormData()
        formData.set('product_id', item.productId)
        formData.set('quantity', String(item.quantity))
        formData.set('unit_price', String(adjustedPrice))
        formData.set('sale_type', saleType)
        if (reason.trim()) formData.set('reason', reason.trim())
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

        const result = await createSale(formData)
        if (result?.error) {
          errors.push(`${item.name}: ${result.error}`)
        } else {
          successCount++
        }
      }

      if (successCount > 0) {
        showSaleNotification({ lines: successCount, total })
        clearCart()
        resetPayment()
        setPayOpen(false)
        setMessage({
          type: 'ok',
          text:
            errors.length === 0
              ? `Sale completed — ${successCount} item(s), total ${total.toFixed(2)}`
              : `Partial: ${successCount} ok, ${errors.length} failed. ${errors.join('; ')}`,
        })
        setTimeout(() => router.refresh(), 300)
      } else {
        setMessage({ type: 'err', text: errors.join('; ') || 'Sale failed' })
      }
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Sale failed. Please try again.',
      })
    } finally {
      setIsPending(false)
    }
  }


  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0)

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-800/50 bg-amber-950/30 p-6 text-center text-amber-200 mx-2">
        No products available for sale (all out of stock or inactive).
        Ask admin to add stock in Inventory Control.
      </div>
    )
  }

  function CartLines({ compact }: { compact?: boolean }) {
    if (cart.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">Order is empty</p>
          <p className="text-slate-400/80 text-xs mt-1">Add items to the order</p>
        </div>
      )
    }
    return (
      <>
        {cart.map((item, index) => {
          const lineTotal = item.unitPrice * item.quantity
          const isSelected = selectedCartIndex === index
          return (
            <div
              key={`${item.productId}-${index}`}
              onClick={() => setSelectedCartIndex(index)}
              className={`flex flex-col gap-1.5 px-3 py-2.5 border-b border-slate-100 cursor-pointer transition ${
                isSelected ? 'bg-sky-50 ring-1 ring-inset ring-sky-200' : 'bg-white active:bg-slate-50'
              } ${compact ? 'text-sm' : 'text-base'}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 font-medium truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Cost: {item.cost.toFixed(2)}
                    {item.unitPrice > 0 && (
                      <span className="text-slate-400">
                        {' '}
                        · margin{' '}
                        {(
                          ((item.unitPrice - item.cost) / item.unitPrice) *
                          100
                        ).toFixed(0)}
                        %
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-slate-900 font-semibold shrink-0 tabular-nums">
                  {lineTotal.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      updateUnitPrice(index, isNaN(v) ? 0 : v)
                    }}
                    className="w-[4.5rem] rounded-lg bg-white border border-slate-200 px-2 py-1 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </label>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-xs text-slate-400 mr-1">×{item.quantity}</span>
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 md:h-[calc(100vh-5.5rem)] md:min-h-[520px] md:flex-none max-w-[900px] mx-auto md:rounded-2xl overflow-hidden border-0 md:border border-slate-200 bg-[#f5f6f8] shadow-none md:shadow-xl text-slate-900">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-slate-200/80 shrink-0 safe-top">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold">
            U
          </span>
          <span className="font-semibold text-base tracking-tight text-slate-900">
            Union
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const pct = window.prompt('Discount % (0–100)', String(discountPct))
              if (pct == null) return
              const n = parseFloat(pct)
              if (!isNaN(n) && n >= 0 && n <= 100) setDiscountPct(n)
            }}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 touch-manipulation min-h-[36px]"
          >
            % Off
          </button>
          <button
            type="button"
            onClick={() => setChartOpen(true)}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs border border-slate-200 touch-manipulation min-h-[36px]"
          >
            📊
          </button>
        </div>
      </div>

      {/* Order panel (top, like reference) */}
      <div className="shrink-0 bg-white border-b border-slate-200 max-h-[32vh] overflow-y-auto overscroll-contain">
        <CartLines />
        {cart.length > 0 && (
          <div className="px-3 py-2 flex items-center justify-between border-t border-slate-100 bg-slate-50/80">
            {discountPct > 0 && (
              <span className="text-xs text-amber-700">
                −{discountPct}% ({discountAmount.toFixed(2)})
              </span>
            )}
            <span className="ml-auto text-sm font-bold text-slate-900 tabular-nums">
              Total {total.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-2 pb-1.5 shrink-0 bg-[#f5f6f8]">
        <input
          type="search"
          value={productSearch}
          onChange={(e) => {
            setProductSearch(e.target.value)
            if (e.target.value) setActiveCategory(null)
          }}
          placeholder="Search name or SKU…"
          className="w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 touch-manipulation shadow-sm"
          enterKeyHint="search"
          autoComplete="off"
        />
      </div>

      {/* Category chips — soft pills grid like reference */}
      <div className="px-3 pb-2 pt-1 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`rounded-lg px-3 py-2 text-left text-xs font-medium touch-manipulation min-h-[40px] transition ${
              activeCategory === null
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-200/80 text-slate-700 active:bg-slate-300'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() =>
                setActiveCategory(activeCategory === cat.name ? null : cat.name)
              }
              className={`rounded-lg px-3 py-2 text-left text-xs font-medium touch-manipulation min-h-[40px] transition truncate ${
                activeCategory === cat.name
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-200/80 text-slate-700 active:bg-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid — white cards */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-28 md:pb-3">
        <div className="grid grid-cols-3 gap-2">
          {filteredProducts.map((p) => {
            const inCartQty =
              cart.find((c) => c.productId === p.id)?.quantity ?? 0
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                className="rounded-xl bg-white border border-slate-200/90 p-2.5 text-left shadow-sm active:scale-[0.98] transition touch-manipulation min-h-[88px] flex flex-col"
              >
                <div className="font-medium text-slate-900 text-[13px] leading-snug line-clamp-2 flex-1">
                  {p.name}
                </div>
                <div className="mt-2 flex items-end justify-between gap-1">
                  <div>
                    <div className="text-slate-900 font-semibold text-sm tabular-nums">
                      {p.price.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      cost {p.cost.toFixed(2)}
                    </div>
                  </div>
                  {inCartQty > 0 && (
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full font-semibold">
                      ×{inCartQty}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-center text-slate-400 text-sm py-12">
              No products in this view
            </p>
          )}
        </div>
      </div>

      {/* Bottom action bar — qty + clear + pay */}
      <div className="fixed md:static bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-3 shrink-0">
        <div className="flex items-center gap-2 max-w-[900px] mx-auto">
          <button
            type="button"
            disabled={selectedCartIndex == null}
            onClick={() => {
              if (selectedCartIndex == null) return
              const item = cart[selectedCartIndex]
              if (!item) return
              updateQty(selectedCartIndex, item.quantity + 1)
            }}
            className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xl font-medium disabled:opacity-30 touch-manipulation"
            aria-label="Increase quantity"
          >
            +
          </button>
          <button
            type="button"
            disabled={selectedCartIndex == null}
            onClick={() => {
              if (selectedCartIndex == null) return
              const item = cart[selectedCartIndex]
              if (!item) return
              if (item.quantity <= 1) removeFromCart(selectedCartIndex)
              else updateQty(selectedCartIndex, item.quantity - 1)
            }}
            className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xl font-medium disabled:opacity-30 touch-manipulation"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={clearCart}
            className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-30 touch-manipulation flex items-center justify-center"
            aria-label="Clear order"
          >
            🗑
          </button>
          <button
            type="button"
            disabled={cart.length === 0 || isPending}
            onClick={() => {
              resetPayment()
              setPayOpen(true)
              setMessage(null)
            }}
            className="flex-1 h-11 rounded-xl bg-rose-400 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-sm touch-manipulation shadow-sm"
          >
            {isPending ? '…' : cart.length === 0 ? '×' : `Pay ${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Mobile cart bottom sheet */}
      {mobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close cart"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="relative bg-[#121820] rounded-t-2xl border-t border-slate-600 max-h-[85dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h2 className="text-white font-semibold">Bill · {cartItemCount} items</h2>
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 text-lg touch-manipulation"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <CartLines />
            </div>
            <div className="border-t border-slate-700 p-4 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {discountPct > 0 && (
                <div className="flex justify-between text-sm text-amber-300">
                  <span>Discount {discountPct}%</span>
                  <span>−{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="text-sm text-slate-400 disabled:opacity-30 px-2 py-2"
                >
                  Clear all
                </button>
                <span className="text-xl font-bold text-sky-400">
                  {total.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                disabled={cart.length === 0 || isPending}
                onClick={() => {
                  setMobileCartOpen(false)
                  resetPayment()
                  setPayOpen(true)
                  setMessage(null)
                }}
                className="w-full py-3.5 rounded-xl bg-emerald-600 active:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-base touch-manipulation min-h-[52px]"
              >
                {isPending ? 'Processing…' : `Pay ${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message toast */}
      {message && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] px-4 py-3 rounded-xl shadow-lg text-sm ${
            message.type === 'ok'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          } bottom-24 md:bottom-20`}
        >
          {message.text}
          <button
            type="button"
            className="ml-3 opacity-70"
            onClick={() => setMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Payment modal — full screen on mobile */}
      {payOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/70">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-600 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-semibold text-white">Payment</h2>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 text-xl touch-manipulation"
              >
                ×
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="rounded-xl bg-slate-800/80 p-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>{cart.length} line(s)</span>
                  <span>
                    Subtotal {subtotal.toFixed(2)}
                    {discountPct > 0 && ` − ${discountPct}%`}
                  </span>
                </div>
                <div className="text-right text-2xl font-bold text-sky-400 mt-1">
                  {total.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Sale type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'card', 'mb', 'credit'] as SaleType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSaleType(t)}
                      className={`py-3 rounded-xl text-xs font-semibold uppercase touch-manipulation min-h-[48px] ${
                        saleType === t
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {saleType === 'mb' && (
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">Bank / wallet</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-base text-white min-h-[48px]"
                  >
                    <option value="">Select…</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {bank === 'Other' && (
                    <input
                      value={otherBank}
                      onChange={(e) => setOtherBank(e.target.value)}
                      placeholder="Bank name"
                      className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-base text-white min-h-[48px]"
                    />
                  )}
                </div>
              )}

              {saleType === 'credit' && (
                <div className="space-y-3">
                  <input
                    value={creditName}
                    onChange={(e) => setCreditName(e.target.value)}
                    placeholder="Customer name"
                    className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-base text-white min-h-[48px]"
                  />
                  <input
                    value={creditPhone}
                    onChange={(e) => setCreditPhone(e.target.value)}
                    placeholder="Phone number"
                    inputMode="tel"
                    className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-base text-white min-h-[48px]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditMode('full')}
                      className={`py-3 rounded-xl text-sm font-medium touch-manipulation min-h-[48px] ${
                        creditMode === 'full'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Full credit
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditMode('two')}
                      className={`py-3 rounded-xl text-sm font-medium touch-manipulation min-h-[48px] ${
                        creditMode === 'two'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Pay half now
                    </button>
                  </div>
                  {creditMode === 'two' && (
                    <div className="space-y-2 pl-1 border-l-2 border-slate-700">
                      <div className="grid grid-cols-3 gap-2">
                        {(['cash', 'card', 'mb'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPaidHalfType(t)}
                            className={`py-2.5 rounded-lg text-xs uppercase touch-manipulation min-h-[44px] ${
                              paidHalfType === t
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      {paidHalfType === 'mb' && (
                        <>
                          <select
                            value={paidHalfBank}
                            onChange={(e) => setPaidHalfBank(e.target.value)}
                            className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-base text-white min-h-[48px]"
                          >
                            <option value="">Select bank…</option>
                            {BANKS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                          {paidHalfBank === 'Other' && (
                            <input
                              value={paidHalfOtherBank}
                              onChange={(e) => setPaidHalfOtherBank(e.target.value)}
                              placeholder="Bank name"
                              className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-base text-white min-h-[48px]"
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Notes (required if any price is 0)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Optional notes…"
                  className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-3 text-base text-white resize-y"
                />
              </div>

              {message?.type === 'err' && (
                <p className="text-sm text-red-300 bg-red-950/50 rounded-lg px-3 py-2">
                  {message.text}
                </p>
              )}

              <button
                type="button"
                disabled={isPending}
                onClick={completeSale}
                className="w-full py-3.5 rounded-xl bg-emerald-600 active:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-base touch-manipulation min-h-[52px]"
              >
                {isPending ? 'Processing…' : `Confirm pay ${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales chart panel */}
      {chartOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/70">
          <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-600 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-900">
              <h2 className="text-lg font-semibold text-white">📊 Sales chart</h2>
              <button
                type="button"
                onClick={() => setChartOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 text-xl touch-manipulation"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Today revenue</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">
                    {(chart?.todayRevenue ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Today sales</p>
                  <p className="text-lg font-bold text-sky-400 mt-0.5">
                    {chart?.todayCount ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase text-slate-500">7-day revenue</p>
                  <p className="text-lg font-bold text-violet-400 mt-0.5">
                    {(chart?.weekRevenue ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase text-slate-500">7-day sales</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">
                    {chart?.weekCount ?? 0}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium text-slate-400 uppercase mb-3">
                  Last 7 days
                </h3>
                {chartDays.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No data</p>
                ) : (
                  <div className="flex items-end gap-2 h-40 px-1">
                    {chartDays.map((d) => {
                      const pct = (d.revenue / chartMaxRev) * 100
                      return (
                        <div
                          key={d.date}
                          className="flex-1 flex flex-col items-center gap-1 min-w-0"
                        >
                          <span className="text-[10px] text-slate-400 truncate w-full text-center">
                            {d.revenue > 0 ? d.revenue.toFixed(0) : ''}
                          </span>
                          <div className="w-full flex-1 flex items-end">
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[3px]"
                              style={{
                                height: `${Math.max(d.revenue > 0 ? 6 : 3, pct)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500 truncate w-full text-center">
                            {d.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
