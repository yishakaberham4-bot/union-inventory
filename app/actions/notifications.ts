'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export type NotificationType =
  | 'product_added'
  | 'product_edited'
  | 'product_deleted'
  | 'stock_adjusted'
  | 'price_updated'
  | 'credit_paid'
  | 'debit_paid'
  | 'sale_returned'
  | 'credit_overdue'
  | 'debit_overdue'
  | 'other'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  entity_id?: string | null
  entity_name?: string | null
  actor?: string | null
  is_read: boolean
  created_at: string
}

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

  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Run this SQL once in Supabase SQL editor (Dashboard → SQL → New query):
 *
 * create extension if not exists pgcrypto;
 * create table if not exists public.notifications (
 *   id uuid primary key default gen_random_uuid(),
 *   type text not null,
 *   title text not null,
 *   message text not null default '',
 *   entity_id text,
 *   entity_name text,
 *   actor text,
 *   is_read boolean not null default false,
 *   created_at timestamptz not null default now()
 * );
 * create index if not exists notifications_created_at_idx on public.notifications (created_at desc);
 * create index if not exists notifications_is_read_idx on public.notifications (is_read);
 * -- Service role bypasses RLS; optional open policy for debugging:
 * alter table public.notifications enable row level security;
 * drop policy if exists "service and authenticated read" on public.notifications;
 * create policy "authenticated read notifications"
 *   on public.notifications for select to authenticated using (true);
 */

export async function logNotification(input: {
  type: NotificationType
  title: string
  message?: string
  entity_id?: string | null
  entity_name?: string | null
  actor?: string | null
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const admin = getAdminClient()
    const { error } = await admin.from('notifications').insert({
      type: input.type,
      title: input.title,
      message: input.message || '',
      entity_id: input.entity_id ?? null,
      entity_name: input.entity_name ?? null,
      actor: input.actor ?? null,
      is_read: false,
    })
    if (error) {
      console.error('[notifications] insert failed:', error.message)
      return { error: error.message }
    }
    revalidatePath('/admin/notifications')
    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to log notification'
    console.error('[notifications]', msg)
    return { error: msg }
  }
}

export async function getNotifications(limit = 50): Promise<{
  items: AppNotification[]
  error?: string
  tableMissing?: boolean
}> {
  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      const msg = error.message || ''
      const tableMissing =
        msg.toLowerCase().includes('does not exist') ||
        msg.toLowerCase().includes('schema cache') ||
        msg.toLowerCase().includes('relation')
      console.error('[notifications] list failed:', msg)
      return { items: [], error: msg, tableMissing }
    }

    const items = (data || []).map((row: any) => ({
      id: row.id as string,
      type: row.type as NotificationType,
      title: row.title as string,
      message: (row.message as string) || '',
      entity_id: row.entity_id ?? null,
      entity_name: row.entity_name ?? null,
      actor: row.actor ?? null,
      is_read: Boolean(row.is_read),
      created_at: row.created_at as string,
    }))
    return { items }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load notifications'
    return { items: [], error: msg }
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const admin = getAdminClient()
    const { count, error } = await admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) {
      console.error('[notifications] count failed:', error.message)
      return 0
    }
    return count ?? 0
  } catch {
    return 0
  }
}

export async function markNotificationRead(id: string) {
  try {
    const admin = getAdminClient()
    const { error } = await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/notifications')
    return { success: true }
  } catch {
    return { error: 'Failed' }
  }
}

export async function markAllNotificationsRead() {
  try {
    const admin = getAdminClient()
    const { error } = await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    if (error) return { error: error.message }
    revalidatePath('/admin/notifications')
    return { success: true }
  } catch {
    return { error: 'Failed' }
  }
}

export async function deleteNotification(id: string) {
  try {
    const admin = getAdminClient()
    const { error } = await admin.from('notifications').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/notifications')
    return { success: true }
  } catch {
    return { error: 'Failed' }
  }
}

/** Insert a sample notification so you can verify the UI works */
export async function createTestNotification() {
  return logNotification({
    type: 'other',
    title: 'Test notification',
    message:
      'If you see this, the notifications table is working. Product changes will appear here too.',
  })
}

/**
 * Scan outstanding credit sales and debit (purchase) credits older than 7 days
 * and create notifications if none were logged recently for the same entity.
 * Call from admin pages (credit / debit / notifications) so it runs opportunistically.
 */
export async function checkAndNotifyOverdueCredits(): Promise<{
  created: number
  error?: string
}> {
  try {
    const admin = getAdminClient()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoIso = weekAgo.toISOString()

    let created = 0

    // --- Credit sales (customer owes us) older than 7 days with outstanding balance ---
    const { data: creditSales, error: salesErr } = await admin
      .from('sales')
      .select(
        'id, product_name, credit_customer_name, credit_phone, credit_amount, paid_amount, total_amount, created_at, sale_type'
      )
      .like('sale_type', 'credit%')
      .lt('created_at', weekAgoIso)
      .limit(200)

    if (salesErr) {
      console.error('[notifications] overdue sales scan:', salesErr.message)
    } else if (creditSales?.length) {
      for (const s of creditSales) {
        const creditAmt =
          s.credit_amount != null
            ? Number(s.credit_amount)
            : Number(s.total_amount || 0)
        const paid = Number(s.paid_amount || 0)
        const outstanding = Math.max(0, creditAmt - paid)
        if (outstanding <= 0) continue

        // Avoid spamming: skip if we already notified this entity for overdue in last 3 days
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const { data: existing } = await admin
          .from('notifications')
          .select('id')
          .eq('type', 'credit_overdue')
          .eq('entity_id', s.id)
          .gte('created_at', threeDaysAgo.toISOString())
          .limit(1)

        if (existing && existing.length > 0) continue

        const customer =
          (s.credit_customer_name as string) ||
          (s.credit_phone as string) ||
          'Unknown customer'
        const days = Math.floor(
          (Date.now() - new Date(s.created_at as string).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        await logNotification({
          type: 'credit_overdue',
          title: 'Credit overdue (>1 week)',
          message: `${customer} — ${s.product_name || 'sale'} outstanding ${outstanding.toFixed(
            2
          )} for ${days} days`,
          entity_id: s.id as string,
          entity_name: customer,
        })
        created++
      }
    }

    // --- Debit purchases (we owe supplier) older than 7 days ---
    const { data: products, error: prodErr } = await admin
      .from('products')
      .select(
        'id, name, sku, supplier_name, supplier_phone, purchase_credit_amount, purchase_paid_amount, created_at, purchase_type'
      )
      .eq('purchase_type', 'credit')
      .lt('created_at', weekAgoIso)
      .limit(200)

    if (prodErr) {
      console.error('[notifications] overdue debit scan:', prodErr.message)
    } else if (products?.length) {
      for (const p of products) {
        const creditAmt = Number(p.purchase_credit_amount || 0)
        const paid = Number(p.purchase_paid_amount || 0)
        const outstanding = Math.max(0, creditAmt - paid)
        if (outstanding <= 0) continue

        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
        const { data: existing } = await admin
          .from('notifications')
          .select('id')
          .eq('type', 'debit_overdue')
          .eq('entity_id', p.id)
          .gte('created_at', threeDaysAgo.toISOString())
          .limit(1)

        if (existing && existing.length > 0) continue

        const supplier =
          (p.supplier_name as string) ||
          (p.supplier_phone as string) ||
          'Unknown supplier'
        const days = Math.floor(
          (Date.now() - new Date(p.created_at as string).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        await logNotification({
          type: 'debit_overdue',
          title: 'Debit overdue (>1 week)',
          message: `${supplier} — ${p.name || p.sku || 'product'} outstanding ${outstanding.toFixed(
            2
          )} for ${days} days`,
          entity_id: p.id as string,
          entity_name: p.name as string,
        })
        created++
      }
    }

    return { created }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Overdue check failed'
    console.error('[notifications] overdue:', msg)
    return { created: 0, error: msg }
  }
}
