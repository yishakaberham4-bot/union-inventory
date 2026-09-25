'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export interface Product {
  id: string
  sku: string
  name: string
  description?: string | null
  category?: string | null
  price: number
  cost?: number | null
  stock_qty: number
  low_stock_threshold: number
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
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
  if (serviceKey.startsWith('sb_publishable_')) {
    throw new Error(
      'Invalid API key: use the secret key (sb_secret_...), not the publishable key.'
    )
  }

  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function friendlyError(message: string): string {
  const msg = (message || '').toLowerCase()
  if (msg.includes('invalid api key')) {
    return 'Invalid API key. Use sb_secret_... in SUPABASE_SERVICE_ROLE_KEY.'
  }
  if (msg.includes('duplicate') || msg.includes('unique')) {
    return 'A product with this SKU already exists.'
  }
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'Products table not found. Run the SQL schema in Supabase (see admin/inventory page).'
  }
  return message || 'Request failed'
}

function revalidateInventory() {
  revalidatePath('/admin/inventory')
  revalidatePath('/admin/inventory/stock')
  revalidatePath('/admin/inventory/pricing')
  revalidatePath('/admin/inventory/alerts')
  revalidatePath('/admin')
}

export async function getProducts(): Promise<Product[]> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(friendlyError(error.message))
  return (data || []).map(mapProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(friendlyError(error.message))
  return data ? mapProduct(data) : null
}

export async function getLowStockProducts(): Promise<Product[]> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('products')
    .select('*')
    .order('stock_qty', { ascending: true })

  if (error) throw new Error(friendlyError(error.message))

  return (data || [])
    .map(mapProduct)
    .filter((p) => p.stock_qty <= p.low_stock_threshold)
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku || '',
    name: row.name || '',
    description: row.description,
    category: row.category,
    price: Number(row.price) || 0,
    cost: row.cost != null ? Number(row.cost) : null,
    stock_qty: Number(row.stock_qty) || 0,
    low_stock_threshold: Number(row.low_stock_threshold) ?? 5,
    is_active: row.is_active !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function createProduct(formData: FormData) {
  const sku = String(formData.get('sku') || '').trim().toUpperCase()
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const category = String(formData.get('category') || '').trim() || null
  const price = parseFloat(String(formData.get('price') || '0'))
  const cost = parseFloat(String(formData.get('cost') || '0'))
  const stock_qty = parseInt(String(formData.get('stock_qty') || '0'), 10)
  const low_stock_threshold = parseInt(
    String(formData.get('low_stock_threshold') || '5'),
    10
  )

  if (!sku || !name) {
    return { error: 'SKU and product name are required' }
  }
  if (isNaN(price) || price < 0) {
    return { error: 'Price must be a valid number ≥ 0' }
  }
  if (isNaN(stock_qty) || stock_qty < 0) {
    return { error: 'Stock quantity must be a valid number ≥ 0' }
  }

  const admin = getAdminClient()
  const { error } = await admin.from('products').insert({
    sku,
    name,
    description,
    category,
    price,
    cost: isNaN(cost) ? 0 : cost,
    stock_qty,
    low_stock_threshold: isNaN(low_stock_threshold) ? 5 : low_stock_threshold,
    is_active: true,
  })

  if (error) return { error: friendlyError(error.message) }

  revalidateInventory()
  redirect('/admin/inventory')
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get('id') || '')
  const sku = String(formData.get('sku') || '').trim().toUpperCase()
  const name = String(formData.get('name') || '').trim()
  const description = String(formData.get('description') || '').trim() || null
  const category = String(formData.get('category') || '').trim() || null
  const price = parseFloat(String(formData.get('price') || '0'))
  const cost = parseFloat(String(formData.get('cost') || '0'))
  const stock_qty = parseInt(String(formData.get('stock_qty') || '0'), 10)
  const low_stock_threshold = parseInt(
    String(formData.get('low_stock_threshold') || '5'),
    10
  )
  const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true'

  if (!id) return { error: 'Product ID is required' }
  if (!sku || !name) return { error: 'SKU and product name are required' }

  const admin = getAdminClient()
  const { error } = await admin
    .from('products')
    .update({
      sku,
      name,
      description,
      category,
      price,
      cost: isNaN(cost) ? 0 : cost,
      stock_qty: isNaN(stock_qty) ? 0 : stock_qty,
      low_stock_threshold: isNaN(low_stock_threshold) ? 5 : low_stock_threshold,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: friendlyError(error.message) }

  revalidateInventory()
  redirect('/admin/inventory')
}

export async function adjustStock(formData: FormData) {
  const id = String(formData.get('id') || '')
  const mode = String(formData.get('mode') || 'set') // set | add | remove
  const amount = parseInt(String(formData.get('amount') || '0'), 10)

  if (!id) return { error: 'Product ID is required' }
  if (isNaN(amount) || amount < 0) return { error: 'Amount must be a valid number ≥ 0' }

  const admin = getAdminClient()
  const { data: product, error: fetchErr } = await admin
    .from('products')
    .select('stock_qty')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return { error: friendlyError(fetchErr.message) }
  if (!product) return { error: 'Product not found' }

  let newQty = Number(product.stock_qty) || 0
  if (mode === 'add') newQty += amount
  else if (mode === 'remove') newQty = Math.max(0, newQty - amount)
  else newQty = amount

  const { error } = await admin
    .from('products')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: friendlyError(error.message) }

  revalidateInventory()
  return { success: true, stock_qty: newQty }
}

export async function updatePrice(formData: FormData) {
  const id = String(formData.get('id') || '')
  const price = parseFloat(String(formData.get('price') || ''))
  const costRaw = formData.get('cost')
  const cost =
    costRaw !== null && costRaw !== ''
      ? parseFloat(String(costRaw))
      : undefined

  if (!id) return { error: 'Product ID is required' }
  if (isNaN(price) || price < 0) return { error: 'Price must be a valid number ≥ 0' }

  const admin = getAdminClient()
  const payload: Record<string, unknown> = {
    price,
    updated_at: new Date().toISOString(),
  }
  if (cost !== undefined && !isNaN(cost)) {
    payload.cost = cost
  }

  const { error } = await admin.from('products').update(payload).eq('id', id)

  if (error) return { error: friendlyError(error.message) }

  revalidateInventory()
  return { success: true }
}

export async function updateLowStockThreshold(formData: FormData) {
  const id = String(formData.get('id') || '')
  const threshold = parseInt(String(formData.get('low_stock_threshold') || '5'), 10)

  if (!id) return { error: 'Product ID is required' }
  if (isNaN(threshold) || threshold < 0) {
    return { error: 'Threshold must be a valid number ≥ 0' }
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from('products')
    .update({
      low_stock_threshold: threshold,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: friendlyError(error.message) }

  revalidateInventory()
  return { success: true }
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get('id') || '')
  if (!id) return { error: 'Product ID is required' }

  const admin = getAdminClient()
  const { error } = await admin.from('products').delete().eq('id', id)

  if (error) return { error: friendlyError(error.message) }

  revalidateInventory()
  redirect('/admin/inventory')
}
