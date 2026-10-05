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

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-800/50 bg-amber-950/30 p-6 text-center text-amber-200">
        No products available for sale (all out of stock or inactive).
        Ask admin to add stock in Inventory Control.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-[520px] max-w-[1400px] mx-auto rounded-2xl overflow-hidden border border-slate-700/80 bg-[#1a2332] shadow-2xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#151c28] border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-wide text-white">iTBOS</span>
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null)
                setProductSearch('')
              }}
              className={`px-3 py-1 rounded-md transition ${
                !activeCategory && !productSearch
                  ? 'text-sky-300 border-b-2 border-sky-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GROUPS
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 px-2">SEARCH</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => {
              if (cart.length === 0) {
                setMessage({ type: 'err', text: 'Add items to the bill first' })
                return
              }
              setMessage(null)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
          >
            🧾 BILL
          </button>
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => {
              resetPayment()
              setPayOpen(true)
              setMessage(null)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white border border-emerald-600 transition font-medium"
          >
            💳 PAY
          </button>
          <button
            type="button"
            onClick={() => {
              const pct = window.prompt('Discount % (0–100)', String(discountPct))
              if (pct == null) return
              const n = parseFloat(pct)
              if (!isNaN(n) && n >= 0 && n <= 100) setDiscountPct(n)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
          >
            % DISCOUNT
          </button>
          <button
            type="button"
            onClick={() => setChartOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-700/80 hover:bg-violet-600 text-white border border-violet-500/60 transition font-medium"
          >
            📊 CHART
          </button>
        </div>
      </div>

      {/* Mini chart strip */}
      {chartDays.length > 0 && (
        <button
          type="button"
          onClick={() => setChartOpen(true)}
          className="shrink-0 flex items-end gap-1 h-10 px-3 py-1.5 bg-[#0e141c]/80 border-b border-slate-800/80 hover:bg-slate-900/60 transition w-full text-left"
          title="Open sales chart"
        >
          <span className="text-[10px] text-slate-500 self-center mr-2 hidden sm:inline">
            7d
          </span>
          {chartDays.map((d) => {
            const pct = (d.revenue / chartMaxRev) * 100
            return (
              <div
                key={d.date}
                className="flex-1 flex items-end h-full min-w-0"
                title={`${d.label}: ${d.revenue.toFixed(0)}`}
              >
                <div
                  className="w-full rounded-t bg-emerald-500/70 min-h-[2px]"
                  style={{ height: `${Math.max(d.revenue > 0 ? 8 : 4, pct)}%` }}
                />
              </div>
            )
          })}
          <span className="text-[10px] text-emerald-400/90 self-center ml-2 font-medium whitespace-nowrap">
            Today {(chart?.todayRevenue ?? 0).toFixed(0)}
          </span>
        </button>
      )}

      {/* Main body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: category tiles + products */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-700/50">
          {/* Search */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <input
              type="search"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value)
                if (e.target.value) setActiveCategory(null)
              }}
              placeholder="Search product by name or SKU…"
              className="w-full rounded-xl bg-slate-900/80 border border-slate-600 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Category grid */}
          {!productSearch && (
            <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 max-h-[42%] overflow-y-auto">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`rounded-xl p-3 text-left transition shadow-md ${
                  activeCategory === null
                    ? 'ring-2 ring-sky-400 bg-slate-700'
                    : 'bg-slate-700/80 hover:bg-slate-600'
                }`}
              >
                <div className="font-semibold text-white text-sm">All</div>
                <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                  <span>{products.length} items</span>
                  <span className="opacity-60">→</span>
                </div>
              </button>
              {categories.map((cat, i) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() =>
                    setActiveCategory(activeCategory === cat.name ? null : cat.name)
                  }
                  className={`rounded-xl p-3 text-left transition shadow-md text-white ${
                    CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                  } ${
                    activeCategory === cat.name ? 'ring-2 ring-white/80 scale-[1.02]' : 'hover:brightness-110'
                  }`}
                >
                  <div className="font-semibold text-sm truncate">{cat.name}</div>
                  <div className="text-xs opacity-90 mt-1 flex items-center justify-between">
                    <span>{cat.count} items</span>
                    <span className="opacity-70">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Product list under category */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredProducts.map((p) => {
                const inCartQty =
                  cart.find((c) => c.productId === p.id)?.quantity ?? 0
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-600/60 p-3 text-left transition group"
                  >
                    <div className="font-medium text-white text-sm truncate group-hover:text-sky-200">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex justify-between gap-2">
                      <span>{p.sku || '—'}</span>
                      <span className="text-slate-500">Stock {p.stock_qty}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-emerald-400 font-semibold text-sm">
                        {p.price.toFixed(2)}
                      </span>
                      {inCartQty > 0 && (
                        <span className="text-xs bg-sky-600/80 text-white px-2 py-0.5 rounded-full">
                          ×{inCartQty}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
              {filteredProducts.length === 0 && (
                <p className="col-span-full text-center text-slate-500 text-sm py-8">
                  No products in this view
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: cart / bill */}
        <div className="w-full max-w-[380px] sm:max-w-[420px] flex flex-col bg-[#121820] shrink-0">
          <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between text-xs text-slate-400 uppercase tracking-wide shrink-0">
            <span className="w-[40%]">Title</span>
            <span className="w-[12%] text-center">Code</span>
            <span className="w-[12%] text-center">Items</span>
            <span className="w-[16%] text-right">Price</span>
            <span className="w-[20%] text-right">Total</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-12 px-4">
                Tap products to add them to the bill
              </p>
            ) : (
              cart.map((item, index) => {
                const lineTotal = item.unitPrice * item.quantity
                const selected = selectedCartIndex === index
                return (
                  <div
                    key={`${item.productId}-${index}`}
                    onClick={() => setSelectedCartIndex(index)}
                    className={`flex items-center gap-1 px-3 py-2.5 border-b border-slate-800/80 cursor-pointer text-sm transition ${
                      selected ? 'bg-slate-700/70' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-[40%] min-w-0">
                      <div className="text-white truncate font-medium">{item.name}</div>
                    </div>
                    <div className="w-[12%] text-center text-slate-500 text-xs truncate">
                      {item.sku || '0'}
                    </div>
                    <div className="w-[12%] flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.quantity <= 1) removeFromCart(index)
                          else updateQty(index, item.quantity - 1)
                        }}
                        className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-white font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateQty(index, item.quantity + 1)
                        }}
                        disabled={item.quantity >= item.maxStock}
                        className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white text-xs"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-[16%] text-right text-slate-300 text-xs">
                      {item.unitPrice.toFixed(1)}
                    </div>
                    <div className="w-[20%] text-right text-white font-medium">
                      {lineTotal.toFixed(1)}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Total + actions */}
          <div className="shrink-0 border-t border-slate-700 p-3 space-y-2 bg-[#0e141c]">
            {discountPct > 0 && (
              <div className="flex justify-between text-xs text-amber-300/90">
                <span>Discount {discountPct}%</span>
                <span>−{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-red-300 disabled:opacity-30"
              >
                Clear
              </button>
              <div className="flex-1 text-right">
                <span className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-bold text-base px-5 py-2.5 rounded-lg shadow-lg min-w-[140px]">
                  Total: {total.toFixed(0)}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={cart.length === 0 || isPending}
              onClick={() => {
                resetPayment()
                setPayOpen(true)
                setMessage(null)
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm transition"
            >
              {isPending ? 'Processing…' : 'Checkout / Pay'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom category bar */}
      <div className="shrink-0 flex items-stretch gap-0.5 overflow-x-auto bg-[#0d1219] border-t border-slate-700/60 px-1 py-1">
        <button
          type="button"
          onClick={() => {
            setActiveCategory(null)
            setProductSearch('')
          }}
          className={`flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-lg text-[10px] transition ${
            activeCategory === null
              ? 'bg-slate-700 text-sky-300'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="text-base mb-0.5">⭐</span>
          Favorites
        </button>
        {categories.map((cat, i) => (
          <button
            key={cat.name}
            type="button"
            onClick={() =>
              setActiveCategory(activeCategory === cat.name ? null : cat.name)
            }
            className={`flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-lg text-[10px] transition ${
              activeCategory === cat.name
                ? 'bg-slate-700 text-sky-300'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span
              className={`w-5 h-5 rounded mb-0.5 ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
            />
            <span className="truncate max-w-[56px]">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Message toast */}
      {message && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md px-4 py-3 rounded-xl shadow-2xl text-sm ${
            message.type === 'ok'
              ? 'bg-emerald-900/95 border border-emerald-600 text-emerald-100'
              : 'bg-red-900/95 border border-red-600 text-red-100'
          }`}
        >
          {message.text}
          <button
            type="button"
            className="ml-3 opacity-70 hover:opacity-100"
            onClick={() => setMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sales chart panel */}
      {chartOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-600 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📊</span> Sales chart
              </h2>
              <button
                type="button"
                onClick={() => setChartOpen(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Today revenue</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">
                    {(chart?.todayRevenue ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Today sales</p>
                  <p className="text-lg font-bold text-sky-400 mt-0.5">
                    {chart?.todayCount ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">7-day revenue</p>
                  <p className="text-lg font-bold text-violet-400 mt-0.5">
                    {(chart?.weekRevenue ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/80 border border-slate-700 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">7-day sales</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">
                    {chart?.weekCount ?? 0}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  Last 7 days revenue
                </h3>
                {chartDays.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-10">
                    No sales data for the last week
                  </p>
                ) : (
                  <div className="flex items-end gap-2 h-48 px-1">
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
                              className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[3px] transition-all"
                              style={{
                                height: `${Math.max(d.revenue > 0 ? 6 : 3, pct)}%`,
                              }}
                              title={`${d.label}: ${d.revenue.toFixed(2)} (${d.count} sales)`}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 truncate w-full text-center">
                            {d.label}
                          </span>
                          <span className="text-[9px] text-slate-600">
                            {d.count > 0 ? `${d.count}` : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 text-center">
                Chart updates when you refresh the page after new sales
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-600 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Payment</h2>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-slate-800/80 p-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>{cart.length} line(s)</span>
                  <span>
                    Subtotal {subtotal.toFixed(2)}
                    {discountPct > 0 && ` − ${discountPct}%`}
                  </span>
                </div>
                <div className="text-right text-xl font-bold text-sky-400 mt-1">
                  {total.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Sale type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'card', 'mb', 'credit'] as SaleType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSaleType(t)}
                      className={`py-2 rounded-lg text-xs font-medium uppercase transition ${
                        saleType === t
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
                    className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
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
                      className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
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
                    className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={creditPhone}
                    onChange={(e) => setCreditPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditMode('full')}
                      className={`py-2 rounded-lg text-xs font-medium ${
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
                      className={`py-2 rounded-lg text-xs font-medium ${
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
                      <div className="grid grid-cols-3 gap-1">
                        {(['cash', 'card', 'mb'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPaidHalfType(t)}
                            className={`py-1.5 rounded text-xs uppercase ${
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
                            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
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
                              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
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
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white resize-y"
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
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition"
              >
                {isPending ? 'Processing…' : `Confirm pay ${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
