'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const LOGO_KEY = 'home_logo_url'
const BUCKET = 'assets'
const LOGO_PATH = 'logo/home-logo'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  }
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    throw new Error(
      'Invalid API key: use the secret key (sb_secret_...), not the publishable key.'
    )
  }

  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Ensure the public "assets" storage bucket exists (idempotent).
 */
async function ensureBucket(admin: ReturnType<typeof getAdminClient>) {
  const { data: buckets } = await admin.storage.listBuckets()
  const exists = (buckets || []).some((b) => b.name === BUCKET)
  if (!exists) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024, // 2 MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
    })
  }
}

/**
 * Ensure app_settings table can hold the logo URL.
 * Uses upsert so missing table is reported clearly.
 */
export async function getLogoUrl(): Promise<string> {
  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', LOGO_KEY)
      .maybeSingle()

    if (error) {
      // Table may not exist yet — fall back to static logo
      return '/logo.png'
    }
    if (data?.value) return data.value as string
  } catch {
    // ignore
  }
  return '/logo.png'
}

export async function uploadLogo(
  formData: FormData
): Promise<{ success?: boolean; error?: string; url?: string }> {
  const file = formData.get('logo') as File | null

  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'Please choose an image file.' }
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    return { error: 'Only PNG, JPEG, WebP, GIF, or SVG images are allowed.' }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: 'Image must be 2 MB or smaller.' }
  }

  try {
    const admin = getAdminClient()
    await ensureBucket(admin)

    const ext =
      file.type === 'image/png'
        ? 'png'
        : file.type === 'image/jpeg'
          ? 'jpg'
          : file.type === 'image/webp'
            ? 'webp'
            : file.type === 'image/gif'
              ? 'gif'
              : 'svg'

    const path = `${LOGO_PATH}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Remove any previous logo variants so only one is active
    const { data: existing } = await admin.storage.from(BUCKET).list('logo')
    if (existing?.length) {
      const toRemove = existing.map((f) => `logo/${f.name}`)
      await admin.storage.from(BUCKET).remove(toRemove)
    }

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600',
      })

    if (uploadError) {
      return { error: uploadError.message || 'Upload failed.' }
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path)

    // Cache-bust so the home page shows the new image immediately
    const urlWithBust = `${publicUrl}?v=${Date.now()}`

    const { error: settingsError } = await admin.from('app_settings').upsert(
      {
        key: LOGO_KEY,
        value: urlWithBust,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

    if (settingsError) {
      // Storage succeeded; settings table may be missing
      if (
        settingsError.message?.includes('relation') ||
        settingsError.message?.toLowerCase().includes('does not exist')
      ) {
        return {
          error:
            'Logo uploaded to storage, but app_settings table is missing. Run the SQL below in Supabase SQL Editor, then try again.',
        }
      }
      return { error: settingsError.message || 'Failed to save logo URL.' }
    }

    revalidatePath('/')
    revalidatePath('/admin/profile')

    return { success: true, url: urlWithBust }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed'
    return { error: msg }
  }
}

export async function resetLogo(): Promise<{ success?: boolean; error?: string }> {
  try {
    const admin = getAdminClient()

    // Clear stored URL so home page falls back to /logo.png
    await admin.from('app_settings').delete().eq('key', LOGO_KEY)

    // Optional: clean storage
    try {
      const { data: existing } = await admin.storage.from(BUCKET).list('logo')
      if (existing?.length) {
        await admin.storage.from(BUCKET).remove(existing.map((f) => `logo/${f.name}`))
      }
    } catch {
      // ignore storage cleanup errors
    }

    revalidatePath('/')
    revalidatePath('/admin/profile')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Reset failed'
    return { error: msg }
  }
}
