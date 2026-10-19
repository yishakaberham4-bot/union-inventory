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
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[140px]">
          <div className="w-14 h-14 rounded-full bg-[#e7f3fb] flex items-center justify-center text-2xl mb-3">
            🛒
          </div>
          <p className="text-[#8e8e93] text-[15px] font-medium">Order is empty</p>
          <p className="text-[#b0b0b5] text-[13px] mt-1">Tap a product to add it</p>
        </div>
      )
    }
    return (
      <>
        {cart.map((item, index) => {
          const lineTotal = item.unitPrice * item.quantity
          const isSelected = selectedCartIndex === index
          const initial = (item.name || '?').trim().charAt(0).toUpperCase()
          return (
            <div
              key={`${item.productId}-${index}`}
              onClick={() => setSelectedCartIndex(index)}
              className={`flex gap-3 px-3 py-2.5 cursor-pointer transition active:bg-[#f0f2f5] ${
                isSelected ? 'bg-[#e7f3fb]' : 'bg-white'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-[#2AABEE] text-white flex items-center justify-center text-[15px] font-semibold shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0 border-b border-[#f0f0f0] pb-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[15px] text-[#000] font-medium truncate leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[13px] text-[#8e8e93] mt-0.5">
                      Cost {item.cost.toFixed(2)}
                      {item.unitPrice > 0 && (
                        <span>
                          {' '}
                          ·{' '}
                          {(
                            ((item.unitPrice - item.cost) / item.unitPrice) *
                            100
                          ).toFixed(0)}
                          % margin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[15px] font-semibold text-[#000] tabular-nums">
                      {lineTotal.toFixed(2)}
                    </div>
                    <div className="text-[12px] text-[#8e8e93]">×{item.quantity}</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[12px] text-[#8e8e93]">Price</span>
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
                    className="w-[5rem] rounded-lg bg-[#f0f2f5] border-0 px-2 py-1 text-[14px] text-[#000] font-medium focus:outline-none focus:ring-2 focus:ring-[#2AABEE]/40"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  }


  return (
    <div
      className="flex flex-col h-full min-h-0 flex-1 md:h-[calc(100vh-5.5rem)] md:min-h-[560px] md:flex-none max-w-[440px] mx-auto md:rounded-[32px] overflow-hidden border-0 md:border md:border-white/20 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-[#0f172a] shadow-none md:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.45),0_0_0_1px_rgba(255,255,255,0.4)_inset] [transform-style:preserve-3d] md:[perspective:1200px]"
      style={{
        boxShadow:
          typeof window !== 'undefined'
            ? undefined
            : undefined,
      }}
    >
      {/* 3D gradient header */}
      <div className="relative flex items-center gap-2 px-3 py-3 text-white shrink-0 safe-top overflow-hidden bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 shadow-[0_8px_24px_rgba(37,99,235,0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-cyan-400/30 blur-2xl" />
        <button
          type="button"
          onClick={() => router.push('/sales/pos')}
          className="relative z-10 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 active:scale-95 active:bg-white/25 touch-manipulation text-2xl font-light shadow-lg"
          aria-label="Back"
        >
          ‹
        </button>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="font-bold text-[18px] sm:text-[19px] leading-tight truncate tracking-tight drop-shadow-sm">
            Make Sale
          </div>
          <div className="text-[13px] text-white/90 leading-tight font-medium">
            {cartItemCount > 0
              ? `${cartItemCount} item${cartItemCount === 1 ? '' : 's'} · ${total.toFixed(2)}`
              : 'Tap products to add'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const pct = window.prompt('Discount % (0–100)', String(discountPct))
            if (pct == null) return
            const n = parseFloat(pct)
            if (!isNaN(n) && n >= 0 && n <= 100) setDiscountPct(n)
          }}
          className="relative z-10 px-3 py-2 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 text-[13px] font-semibold touch-manipulation active:scale-95 shadow-md"
        >
          % Off
        </button>
        <button
          type="button"
          onClick={() => setChartOpen(true)}
          className="relative z-10 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 active:scale-95 touch-manipulation text-lg shadow-md"
        >
          📊
        </button>
      </div>

      {/* Search — elevated 3D pill */}
      <div className="px-3 py-2.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-100/90 px-3.5 py-2.5 shadow-[inset_0_2px_4px_rgba(15,23,42,0.06)] border border-slate-200/60">
          <span className="text-slate-400 text-base">🔍</span>
          <input
            type="search"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value)
              if (e.target.value) setActiveCategory(null)
            }}
            placeholder="Search products…"
            className="flex-1 bg-transparent border-0 text-[16px] text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
            enterKeyHint="search"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Order / cart — Telegram list */}
      <div className="shrink-0 max-h-[34vh] overflow-y-auto overscroll-contain bg-white border-b border-[#efefef]">
        <CartLines />
        {cart.length > 0 && (
          <div className="px-4 py-2 flex items-center justify-between bg-[#f7f7f8]">
            {discountPct > 0 ? (
              <span className="text-[13px] text-[#e6a817]">
                −{discountPct}% ({discountAmount.toFixed(2)})
              </span>
            ) : (
              <span className="text-[13px] text-[#8e8e93]">Total</span>
            )}
            <span className="text-[16px] font-semibold tabular-nums text-[#000]">
              {total.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Categories — horizontal Telegram chips */}
      <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-white border-b border-[#efefef]">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium touch-manipulation transition ${
            activeCategory === null
              ? 'bg-[#2AABEE] text-white'
              : 'bg-[#f0f2f5] text-[#000] active:bg-[#e4e6eb]'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() =>
              setActiveCategory(activeCategory === cat.name ? null : cat.name)
            }
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium touch-manipulation transition ${
              activeCategory === cat.name
                ? 'bg-[#2AABEE] text-white'
                : 'bg-[#f0f2f5] text-[#000] active:bg-[#e4e6eb]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products — elevated 3D cards */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 to-white pb-28 px-2 pt-1">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-slate-400 text-[15px] py-16 font-medium">
            No products
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 py-1">
            {filteredProducts.map((p) => {
              const inCartQty =
                cart.find((c) => c.productId === p.id)?.quantity ?? 0
              const initial = (p.name || '?').trim().charAt(0).toUpperCase()
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  className={`w-full flex gap-3 px-3 py-3 text-left touch-manipulation rounded-2xl border transition active:scale-[0.98] ${
                    inCartQty > 0
                      ? 'bg-sky-50 border-sky-200 shadow-[0_6px_16px_-4px_rgba(14,165,233,0.35)]'
                      : 'bg-white border-slate-200/80 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.12)] hover:shadow-[0_8px_20px_-4px_rgba(15,23,42,0.18)]'
                  }`}
                >
                  <div
                    className={`w-13 h-13 min-w-[3.25rem] min-h-[3.25rem] rounded-2xl flex items-center justify-center text-[17px] font-bold shrink-0 shadow-md ${
                      inCartQty > 0
                        ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sky-400/40'
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 text-sky-700'
                    }`}
                  >
                    {inCartQty > 0 ? inCartQty : initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[16px] font-semibold text-slate-900 truncate leading-tight">
                          {p.name}
                        </div>
                        <div className="text-[13px] text-slate-500 mt-0.5 truncate font-medium">
                          {p.sku || '—'} · stock {p.stock_qty}
                        </div>
                        <div className="text-[12px] text-slate-400 mt-0.5">
                          Cost {p.cost.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-[16px] font-bold text-slate-900 tabular-nums shrink-0">
                        {p.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 3D bottom action bar */}
      <div className="fixed md:static bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-2.5 py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:pb-3 shrink-0 max-w-[440px] mx-auto shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={selectedCartIndex == null}
            onClick={() => {
              if (selectedCartIndex == null) return
              const item = cart[selectedCartIndex]
              if (!item) return
              updateQty(selectedCartIndex, item.quantity + 1)
            }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-200 text-sky-600 text-xl font-bold disabled:opacity-30 touch-manipulation flex items-center justify-center shadow-[0_3px_8px_rgba(15,23,42,0.12)] border border-white active:scale-95"
            aria-label="Increase"
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
            className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-200 text-sky-600 text-xl font-bold disabled:opacity-30 touch-manipulation flex items-center justify-center shadow-[0_3px_8px_rgba(15,23,42,0.12)] border border-white active:scale-95"
            aria-label="Decrease"
          >
            −
          </button>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={clearCart}
            className="w-11 h-11 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-200 text-slate-500 disabled:opacity-30 touch-manipulation flex items-center justify-center text-base shadow-[0_3px_8px_rgba(15,23,42,0.12)] border border-white active:scale-95"
            aria-label="Clear"
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
            className="flex-1 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-[16px] touch-manipulation shadow-[0_8px_20px_-4px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] border border-emerald-300/40 active:scale-[0.98]"
          >
            {isPending ? '…' : cart.length === 0 ? 'Pay' : `Pay ${total.toFixed(2)}`}
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
          className={`fixed left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] px-4 py-3 rounded-2xl shadow-lg text-[14px] ${
            message.type === 'ok'
              ? 'bg-[#e7f3fb] border border-[#2AABEE]/30 text-[#0a5a8a]'
              : 'bg-[#fdecea] border border-red-200 text-[#c0392b]'
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
                className="w-full py-4 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 active:from-emerald-500 active:to-teal-700 disabled:opacity-50 text-white font-bold text-[17px] touch-manipulation min-h-[56px] shadow-[0_10px_28px_-6px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] border border-emerald-300/30"
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
