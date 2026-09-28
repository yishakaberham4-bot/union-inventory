'use client'

import { useState, useEffect, useTransition } from 'react'
import { getLogoUrl, uploadLogo, resetLogo } from '@/app/actions/settings'

export default function AdminProfilePage() {
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png')
  const [preview, setPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLogoUrl()
      .then((url) => setLogoUrl(url))
      .catch(() => setLogoUrl('/logo.png'))
      .finally(() => setLoading(false))
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setMessage(null)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setMessage(null)

    startTransition(async () => {
      const result = await uploadLogo(formData)
      if (result.error) {
        setMessage({ type: 'err', text: result.error })
        return
      }
      if (result.url) {
        setLogoUrl(result.url)
        setPreview(null)
        form.reset()
      }
      setMessage({ type: 'ok', text: 'Logo updated. It will appear on the home page.' })
    })
  }

  function onReset() {
    setMessage(null)
    startTransition(async () => {
      const result = await resetLogo()
      if (result.error) {
        setMessage({ type: 'err', text: result.error })
        return
      }
      setLogoUrl('/logo.png')
      setPreview(null)
      setMessage({ type: 'ok', text: 'Logo reset to default (/logo.png).' })
    })
  }

  const displaySrc = preview || logoUrl

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white">Profile & Branding</h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload the logo shown on the home page.
          </p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">Current home page logo</p>
            <div className="flex justify-center p-6 bg-slate-950 rounded-xl border border-slate-800">
              {loading ? (
                <div className="w-[160px] h-[160px] bg-slate-800 animate-pulse rounded-lg" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displaySrc}
                  alt="Home page logo"
                  width={160}
                  height={160}
                  className="object-contain max-w-[160px] max-h-[160px]"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/logo.png'
                  }}
                />
              )}
            </div>
            {preview && (
              <p className="text-xs text-amber-400/90 mt-2 text-center">
                Preview — not saved yet. Click &quot;Upload logo&quot; to apply.
              </p>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="logo"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Choose new logo
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={onFileChange}
                className="block w-full text-sm text-slate-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-purple-600 file:text-white
                  hover:file:bg-purple-500
                  file:cursor-pointer cursor-pointer
                  bg-slate-800 border border-slate-700 rounded-xl"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                PNG, JPEG, WebP, GIF or SVG · max 2 MB
              </p>
            </div>

            {message && (
              <div
                className={`text-sm px-3 py-2 rounded-lg ${
                  message.type === 'ok'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                    : 'bg-red-950/60 text-red-300 border border-red-800/50'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition"
              >
                {pending ? 'Saving…' : 'Upload logo'}
              </button>
              <button
                type="button"
                onClick={onReset}
                disabled={pending}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-200 text-sm transition"
              >
                Reset to default
              </button>
            </div>
          </form>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-slate-500 space-y-2">
          <p className="font-medium text-slate-400">Setup note (admins only)</p>
          <p>
            If logo upload reports a missing table, run this once in the Supabase SQL Editor:
          </p>
          <pre className="overflow-x-auto p-3 bg-slate-950 rounded-lg text-[11px] text-slate-400 border border-slate-800">
{`create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Storage bucket "assets" is created automatically on first upload.
-- Or create manually: Storage → New bucket → name "assets" → Public.`}
          </pre>
        </div>
      </div>
    </div>
  )
}
