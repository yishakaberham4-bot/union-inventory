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
  /** How this stock was purchased: cash | credit */
  purchase_type?: string | null
  supplier_name?: string | null
  supplier_phone?: string | null
  /** Outstanding amount owed for credit purchase (cost * qty at add time) */
  purchase_credit_amount?: number | null
  purchase_paid_amount?: number | null
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
    return 'Products table not found. Please contact your system administrator.'
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
    purchase_type: row.purchase_type ?? null,
    supplier_name: row.supplier_name ?? null,
    supplier_phone: row.supplier_phone ?? null,
    purchase_credit_amount:
      row.purchase_credit_amount != null
        ? Number(row.purchase_credit_amount)
        : null,
    purchase_paid_amount:
      row.purchase_paid_amount != null
        ? Number(row.purchase_paid_amount)
        : null,
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
  const purchaseTypeRaw = String(formData.get('purchase_type') || 'cash')
    .trim()
    .toLowerCase()
  const purchaseType = purchaseTypeRaw === 'credit' ? 'credit' : 'cash'
  const supplierName = String(formData.get('supplier_name') || '').trim() || null
  const supplierPhone = String(formData.get('supplier_phone') || '').trim() || null

  if (!sku || !name) {
    return { error: 'SKU and product name are required' }
  }
  if (isNaN(price) || price <= 0) {
    return { error: 'Sell price must be greater than 0' }
  }
  if (isNaN(stock_qty) || stock_qty < 0) {
    return { error: 'Stock quantity must be a valid number ≥ 0' }
  }
  if (purchaseType === 'credit' && stock_qty < 1) {
    return { error: 'Credit purchase requires stock quantity ≥ 1' }
  }

  const costVal = isNaN(cost) ? 0 : cost
  const purchaseCreditAmount =
    purchaseType === 'credit'
      ? Number((costVal * stock_qty).toFixed(2))
      : 0
  const purchasePaidAmount = 0

  const admin = getAdminClient()
  const basePayload: Record<string, unknown> = {
    sku,
    name,
    description,
    category,
    price,
    cost: costVal,
    stock_qty,
    low_stock_threshold: isNaN(low_stock_threshold) ? 5 : low_stock_threshold,
    is_active: true,
  }
  const fullPayload = {
    ...basePayload,
    purchase_type: purchaseType,
    supplier_name: supplierName,
    supplier_phone: supplierPhone,
    purchase_credit_amount: purchaseCreditAmount,
    purchase_paid_amount: purchasePaidAmount,
  }

  let { error } = await admin.from('products').insert(fullPayload)
  // Retry without purchase columns if schema does not have them yet
  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('column') || msg.includes('schema')) {
      ;({ error } = await admin.from('products').insert(basePayload))
    }
  }

  if (error) return { error: friendlyError(error.message) }

  // Log initial stock as an "add" movement when qty > 0
  if (stock_qty > 0) {
    const { data: created } = await admin
      .from('products')
      .select('id')
      .eq('sku', sku)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (created?.id) {
      await logStockMovement(admin, {
        product_id: created.id,
        product_name: name,
        product_sku: sku,
        mode: 'initial',
        amount: stock_qty,
        previous_qty: 0,
        new_qty: stock_qty,
      })
    }
  }

  revalidateInventory()
  revalidatePath('/admin/inventory/stock/report')
  revalidatePath('/admin/sales/debit')
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
    .select('id, sku, name, stock_qty')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return { error: friendlyError(fetchErr.message) }
  if (!product) return { error: 'Product not found' }

  const previousQty = Number(product.stock_qty) || 0
  let newQty = previousQty
  if (mode === 'add') newQty += amount
  else if (mode === 'remove') newQty = Math.max(0, newQty - amount)
  else newQty = amount

  const { error } = await admin
    .from('products')
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: friendlyError(error.message) }

  // Log movement (ignore if stock_movements table is missing)
  const delta =
    mode === 'add' ? amount : mode === 'remove' ? -Math.min(amount, previousQty) : newQty - previousQty
  await logStockMovement(admin, {
    product_id: id,
    product_name: product.name || '',
    product_sku: product.sku || '',
    mode: mode === 'set' ? 'set' : mode === 'add' ? 'add' : 'remove',
    amount: Math.abs(delta),
    previous_qty: previousQty,
    new_qty: newQty,
  })

  revalidateInventory()
  revalidatePath('/admin/inventory/stock/report')
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
  if (isNaN(price) || price <= 0) return { error: 'Sell price must be greater than 0' }

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

/** Products purchased on credit with outstanding balance */
export async function getCreditPurchases(): Promise<Product[]> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('column') || msg.includes('schema')) {
      return []
    }
    throw new Error(friendlyError(error.message))
  }

  return (data || [])
    .map(mapProduct)
    .filter((p) => {
      if ((p.purchase_type || '').toLowerCase() !== 'credit') return false
      const credit = p.purchase_credit_amount ?? 0
      const paid = p.purchase_paid_amount ?? 0
      return credit - paid > 0.001
    })
}

/**
 * Mark a credit product purchase as paid.
 * Requires the current admin user's password.
 */
export async function payProductCredit(
  productId: string,
  adminPassword: string
): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    if (!productId) return { error: 'Product ID is required' }
    if (!adminPassword || !String(adminPassword).trim()) {
      return { error: 'Admin password is required' }
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in as admin' }

    const metaRole = (user.user_metadata?.role as string) || ''
    let dbRole = ''
    try {
      const { data: row } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      dbRole = row?.role || ''
    } catch {
      // ignore
    }
    if (metaRole !== 'admin' && dbRole !== 'admin') {
      return { error: 'Only admins can mark purchase credit as paid' }
    }

    const email = user.email
    if (!email) return { error: 'Admin account has no email' }
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: String(adminPassword),
    })
    if (authErr) return { error: 'Invalid admin password' }

    const admin = getAdminClient()
    const { data: product, error: fetchErr } = await admin
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle()

    if (fetchErr) return { error: friendlyError(fetchErr.message) }
    if (!product) return { error: 'Product not found' }
    if ((product.purchase_type || '').toLowerCase() !== 'credit') {
      return { error: 'This product was not purchased on credit' }
    }

    const creditAmt = Number(product.purchase_credit_amount || 0)
    const paidSoFar = Number(product.purchase_paid_amount || 0)
    const outstanding = Math.max(0, creditAmt - paidSoFar)
    if (outstanding <= 0) {
      return { error: 'This purchase credit is already fully paid' }
    }

    const { error: updErr } = await admin
      .from('products')
      .update({
        purchase_paid_amount: creditAmt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    if (updErr) {
      const msg = (updErr.message || '').toLowerCase()
      if (msg.includes('column') || msg.includes('schema')) {
        return {
          error:
            'Database is missing purchase credit columns. Run the SQL migration first.',
        }
      }
      return { error: friendlyError(updErr.message) }
    }

    revalidateInventory()
    revalidatePath('/admin/sales/debit')
    return {
      success: true,
      message: `Purchase credit of ${outstanding.toFixed(2)} marked as paid`,
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to pay purchase credit',
    }
  }
}

export type StockMovement = {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  mode: string
  amount: number
  previous_qty: number
  new_qty: number
  created_at: string
}

async function logStockMovement(
  admin: ReturnType<typeof getAdminClient>,
  row: {
    product_id: string
    product_name: string
    product_sku: string
    mode: string
    amount: number
    previous_qty: number
    new_qty: number
  }
) {
  try {
    const { error } = await admin.from('stock_movements').insert({
      product_id: row.product_id,
      product_name: row.product_name,
      product_sku: row.product_sku,
      mode: row.mode,
      amount: row.amount,
      previous_qty: row.previous_qty,
      new_qty: row.new_qty,
      created_at: new Date().toISOString(),
    })
    if (error) {
      // Table may not exist yet — do not fail the stock adjustment
      console.error('stock_movements log skipped:', error.message)
    }
  } catch (e) {
    console.error('stock_movements log error:', e)
  }
}

/** Stock report: movements by date range. Returns empty + missingTable if table not created yet. */
export async function getStockMovements(opts?: {
  from?: string | null
  to?: string | null
  mode?: string | null
  limit?: number
}): Promise<{ rows: StockMovement[]; missingTable: boolean }> {
  const admin = getAdminClient()
  let q = admin
    .from('stock_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 5000)

  if (opts?.from) {
    const start = opts.from.length === 10 ? opts.from + 'T00:00:00.000Z' : opts.from
    q = q.gte('created_at', start)
  }
  if (opts?.to) {
    const end = opts.to.length === 10 ? opts.to + 'T23:59:59.999Z' : opts.to
    q = q.lte('created_at', end)
  }
  if (opts?.mode && opts.mode !== 'all') {
    q = q.eq('mode', opts.mode)
  }

  const { data, error } = await q
  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (
      msg.includes('relation') ||
      msg.includes('does not exist') ||
      msg.includes('schema cache') ||
      msg.includes('could not find')
    ) {
      return { rows: [], missingTable: true }
    }
    throw new Error(friendlyError(error.message))
  }

  return {
    missingTable: false,
    rows: (data || []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      product_id: String(row.product_id || ''),
      product_name: String(row.product_name || ''),
      product_sku: String(row.product_sku || ''),
      mode: String(row.mode || ''),
      amount: Number(row.amount) || 0,
      previous_qty: Number(row.previous_qty) || 0,
      new_qty: Number(row.new_qty) || 0,
      created_at: String(row.created_at || ''),
    })),
  }
}

/** Products created in a date range (new products added to inventory) */
export async function getProductsCreatedInRange(opts?: {
  from?: string | null
  to?: string | null
}): Promise<Product[]> {
  const admin = getAdminClient()
  let q = admin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (opts?.from) {
    const start = opts.from.length === 10 ? opts.from + 'T00:00:00.000Z' : opts.from
    q = q.gte('created_at', start)
  }
  if (opts?.to) {
    const end = opts.to.length === 10 ? opts.to + 'T23:59:59.999Z' : opts.to
    q = q.lte('created_at', end)
  }

  const { data, error } = await q
  if (error) throw new Error(friendlyError(error.message))
  return (data || []).map(mapProduct)
}
