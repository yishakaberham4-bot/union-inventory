'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createProduct } from '@/app/actions/products'
import { useLanguage } from '@/app/components/LanguageToggle'
import LanguageToggle from '@/app/components/LanguageToggle'
import { t } from '@/app/lib/i18n'

export default function NewProductPage() {
  const lang = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [purchaseType, setPurchaseType] = useState<'cash' | 'credit'>('cash')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setPreview(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(lang === 'am' ? 'ፎቶ ከ 5ሜባ በላይ መሆን አይችልም' : 'Image must be under 5MB')
      e.target.value = ''
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('purchase_type', purchaseType)
    // Ensure file is included
    if (fileRef.current?.files?.[0]) {
      formData.set('image', fileRef.current.files[0])
    }
    const result = await createProduct(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/admin/inventory" className="text-slate-400 hover:text-white text-sm">
              {t(lang, 'backInventory')}
            </Link>
            <h1 className="text-2xl font-bold text-white mt-1">{t(lang, 'addProductTitle')}</h1>
            <p className="text-slate-400 text-sm">{t(lang, 'addProductSubtitle')}</p>
          </div>
          <LanguageToggle className="shrink-0" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
          encType="multipart/form-data"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'sku')}</label>
              <input
                name="sku"
                required
                placeholder={t(lang, 'skuPlaceholder')}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'barcode')}</label>
              <input
                name="barcode"
                inputMode="numeric"
                autoComplete="off"
                placeholder={t(lang, 'barcodePlaceholder')}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">{t(lang, 'barcodeHint')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">{t(lang, 'category')}</label>
            <input
              name="category"
              placeholder={t(lang, 'categoryPlaceholder')}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'productNameEn')}</label>
              <input
                name="name"
                required
                lang="en"
                placeholder={t(lang, 'productNameEnPlaceholder')}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'productNameAm')}</label>
              <input
                name="name_am"
                required
                lang="am"
                dir="auto"
                placeholder={t(lang, 'productNameAmPlaceholder')}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <p className="text-xs text-amber-400/90 -mt-2">{t(lang, 'productNameHint')}</p>

          <div>
            <label className="block text-sm text-slate-300 mb-1">{t(lang, 'description')}</label>
            <textarea
              name="description"
              rows={2}
              lang="am"
              dir="auto"
              placeholder={t(lang, 'descriptionPlaceholder')}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Product picture */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">{t(lang, 'productImage')}</label>
            <p className="text-xs text-slate-500 mb-2">{t(lang, 'productImageHint')}</p>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  name="image"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onImageChange}
                  className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:cursor-pointer cursor-pointer"
                />
              </div>
              {preview && (
                <div className="shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-xl border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'sellPrice')}</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'cost')}</label>
              <input
                name="cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'unit')}</label>
              <select
                name="unit"
                required
                defaultValue="pcs"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="cup">cup</option>
                <option value="bottle">bottle</option>
                <option value="packages">packages</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'stockQty')}</label>
              <input
                name="stock_qty"
                type="number"
                min="0"
                step="any"
                required
                defaultValue={0}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">{t(lang, 'lowStock')}</label>
              <input
                name="low_stock_threshold"
                type="number"
                min="0"
                step="any"
                defaultValue={5}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">{t(lang, 'purchaseType')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPurchaseType('cash')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                  purchaseType === 'cash'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {t(lang, 'cash')}
              </button>
              <button
                type="button"
                onClick={() => setPurchaseType('credit')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                  purchaseType === 'credit'
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {t(lang, 'credit')}
              </button>
            </div>
          </div>

          {purchaseType === 'credit' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">{t(lang, 'supplierName')}</label>
                <input
                  name="supplier_name"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">{t(lang, 'supplierPhone')}</label>
                <input
                  name="supplier_phone"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
          >
            {loading ? t(lang, 'submitting') : t(lang, 'submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
