'use client'

import Link from 'next/link'
import type { Product } from '@/app/actions/products'
import { useLanguage } from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatQty(n: number) {
  if (Number.isInteger(n)) return n.toLocaleString()
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

export default function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const lang = useLanguage()
  const qty = Number(product.stock_qty) || 0
  const cost = Number(product.cost) || 0
  const price = Number(product.price) || 0
  const isLow = qty <= (Number(product.low_stock_threshold) || 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between gap-3">
          <h2 id="product-detail-title" className="font-semibold text-white truncate">
            {product.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex gap-4">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-slate-600 text-sm">
                No image
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-white font-medium text-lg leading-tight">{product.name}</p>
              {product.name_am ? (
                <p className="text-slate-400 text-sm" lang="am">
                  {product.name_am}
                </p>
              ) : null}
              <p className="font-mono text-emerald-400 text-sm">{product.sku}</p>
              {product.category ? (
                <span className="inline-block text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {product.category}
                </span>
              ) : null}
            </div>
          </div>

          {product.description ? (
            <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                {t(lang, 'price')}
              </div>
              <div className="text-emerald-400 font-semibold tabular-nums">
                {formatMoney(price)}
              </div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                {t(lang, 'cost')}
              </div>
              <div className="text-amber-300 font-semibold tabular-nums">
                {formatMoney(cost)}
              </div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                {t(lang, 'stock')}
              </div>
              <div
                className={`font-semibold tabular-nums ${
                  isLow ? 'text-red-400' : 'text-white'
                }`}
              >
                {formatQty(qty)}
                {product.unit ? (
                  <span className="text-slate-500 font-normal text-xs ml-1">
                    {product.unit}
                  </span>
                ) : null}
              </div>
              {isLow ? (
                <div className="text-[10px] text-red-400/80 mt-0.5">Low stock</div>
              ) : null}
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                {t(lang, 'status')}
              </div>
              <div
                className={`font-medium ${
                  product.is_active !== false ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {product.is_active !== false ? t(lang, 'active') : t(lang, 'inactive')}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t border-slate-800 pt-4">
            {product.barcode ? (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{t(lang, 'barcode')}</span>
                <span className="font-mono text-slate-200">{product.barcode}</span>
              </div>
            ) : null}
            {product.purchase_type ? (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{t(lang, 'purchaseType')}</span>
                <span className="text-slate-200 capitalize">{product.purchase_type}</span>
              </div>
            ) : null}
            {product.supplier_name ? (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{t(lang, 'supplierName')}</span>
                <span className="text-slate-200">{product.supplier_name}</span>
              </div>
            ) : null}
            {product.supplier_phone ? (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{t(lang, 'supplierPhone')}</span>
                <span className="text-slate-200">{product.supplier_phone}</span>
              </div>
            ) : null}
            {product.low_stock_threshold != null ? (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">{t(lang, 'lowStock')}</span>
                <span className="text-slate-200 tabular-nums">
                  {formatQty(Number(product.low_stock_threshold))}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 pt-1">
            <Link
              href={`/admin/inventory/${product.id}/edit`}
              className="flex-1 text-center py-2.5 px-4 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
              onClick={onClose}
            >
              {t(lang, 'edit')}
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
            >
              {lang === 'am' ? 'ዝጋ' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
