'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export interface SaleRow {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  unit_cost: number
  total_amount: number
  sale_type: string
  sold_by: string | null
  sold_by_email: string | null
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
  if (msg.includes('relation') && msg.includes('does not exist')) {
    return 'Sales table not found. Run the sales SQL in Supabase (see Make Sale page).'
  }
  if (msg.includes('column') && msg.includes('does not exist')) {
    return `Database column mismatch: ${message}. Re-run the sales table SQL.`
  }
  if (msg.includes('not-null') || msg.includes('null value')) {
    return `Missing required field: ${message}`
  }
  return message || 'Request failed'
}

export async function getAvailableProductsForSale() {
  const admin = getAdminClient()
  // Do not filter is_active = true only — null should still show
  const { data, error } = await admin
    .from('products')
    .select('id, sku, name, price, cost, stock_qty, is_active')
    .gt('stock_qty', 0)
    .order('name', { ascending: true })

  if (error) throw new Error(friendlyError(error.message))

  return (data || [])
    .filter((row) => row.is_active !== false)
    .map((row) => ({
      id: row.id as string,
      sku: (row.sku as string) || '',
      name: (row.name as string) || '',
      price: Number(row.price) || 0,
      cost: row.cost != null ? Number(row.cost) : 0,
      stock_qty: Number(row.stock_qty) || 0,
    }))
}

async function insertSaleRow(
  admin: ReturnType<typeof getAdminClient>,
  payload: Record<string, unknown>
) {
  // Try full payload first (new + legacy columns)
  let { error } = await admin.from('sales').insert(payload)
  if (!error) return null

  const msg = (error.message || '').toLowerCase()

  // Retry without legacy-only columns
  if (msg.includes('column') || msg.includes('schema cache')) {
    const minimal = { ...payload }
    delete minimal.sold_price
    delete minimal.buy_price
    delete minimal.total_price
    ;({ error } = await admin.from('sales').insert(minimal))
    if (!error) return null
  }

  // Retry with only legacy names
  if (msg.includes('column') || msg.includes('schema cache') || error) {
    const legacy: Record<string, unknown> = {
      product_id: payload.product_id,
      product_name: payload.product_name,
      product_sku: payload.product_sku,
      quantity: payload.quantity,
      sold_price: payload.sold_price ?? payload.unit_price,
      buy_price: payload.buy_price ?? payload.unit_cost,
      total_price: payload.total_price ?? payload.total_amount,
      sale_type: payload.sale_type,
      sold_by: payload.sold_by,
      sold_by_email: payload.sold_by_email,
    }
    ;({ error } = await admin.from('sales').insert(legacy))
    if (!error) return null
  }

  return error
}

export async function createSale(formData: FormData) {
  try {
    const productId = String(formData.get('product_id') || '').trim()
    const quantity = parseInt(String(formData.get('quantity') || '0'), 10)
    const saleTypeRaw = String(formData.get('sale_type') || 'cash')
      .trim()
      .toLowerCase()
    const bank = String(formData.get('bank') || '').trim()
    const unitPriceInput = parseFloat(String(formData.get('unit_price') || ''))

    if (!productId) return { error: 'Please select a product' }
    if (isNaN(quantity) || quantity < 1) {
      return { error: 'Quantity must be at least 1' }
    }
    if (isNaN(unitPriceInput) || unitPriceInput < 0) {
      return { error: 'Enter a valid selling price (≥ 0)' }
    }
    if (!['cash', 'card', 'mb'].includes(saleTypeRaw)) {
      return { error: 'Invalid sale type' }
    }
    if (saleTypeRaw === 'mb' && !bank) {
      return { error: 'Select which bank for MB payment' }
    }

    const saleType = saleTypeRaw === 'mb' ? `mb:${bank}` : saleTypeRaw

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'You must be logged in to make a sale' }

    const admin = getAdminClient()

    const { data: product, error: fetchErr } = await admin
      .from('products')
      .select('id, sku, name, price, cost, stock_qty, is_active')
      .eq('id', productId)
      .maybeSingle()

    if (fetchErr) return { error: friendlyError(fetchErr.message) }
    if (!product) return { error: 'Product not found' }
    if (product.is_active === false) return { error: 'Product is not active' }

    const stock = Number(product.stock_qty) || 0
    if (stock < quantity) {
      return {
        error: `Insufficient stock. Only ${stock} available for "${product.name}".`,
      }
    }

    const unitPrice = unitPriceInput
    const unitCost = product.cost != null ? Number(product.cost) : 0
    const totalAmount = Number((unitPrice * quantity).toFixed(2))
    const newStock = stock - quantity

    const { error: stockErr } = await admin
      .from('products')
      .update({
        stock_qty: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    if (stockErr) return { error: friendlyError(stockErr.message) }

    const soldByLabel =
      (user.user_metadata?.staff_id as string) ||
      user.email?.split('@')[0] ||
      null

    const saleErr = await insertSaleRow(admin, {
      product_id: productId,
      product_name: product.name,
      product_sku: product.sku || '',
      quantity,
      unit_price: unitPrice,
      unit_cost: unitCost,
      total_amount: totalAmount,
      sold_price: unitPrice,
      buy_price: unitCost,
      total_price: totalAmount,
      sale_type: saleType,
      sold_by: user.id,
      sold_by_email: soldByLabel,
    })

    if (saleErr) {
      // rollback stock
      await admin
        .from('products')
        .update({ stock_qty: stock, updated_at: new Date().toISOString() })
        .eq('id', productId)
      return { error: friendlyError(saleErr.message) }
    }

    try {
      revalidatePath('/sales/pos')
      revalidatePath('/sales/make')
      revalidatePath('/sales/report')
      revalidatePath('/admin/inventory')
      revalidatePath('/admin/inventory/stock')
      revalidatePath('/admin/inventory/alerts')
    } catch {
      // ignore revalidate errors
    }

    const typeLabel = saleTypeRaw === 'mb' ? `MB (${bank})` : saleTypeRaw
    return {
      success: true,
      message: `Sold ${quantity} × ${product.name} @ ${unitPrice.toFixed(2)} (${typeLabel}) — Total: ${totalAmount.toFixed(2)}`,
      remaining_stock: newStock,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Sale failed'
    return { error: friendlyError(msg) }
  }
}

export async function getSalesReport(limit = 100): Promise<SaleRow[]> {
  const admin = getAdminClient()

  // Prefer order by created_at; fallback if column missing
  let data: any[] | null = null
  let error: { message: string } | null = null

  {
    const res = await admin
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    data = res.data
    error = res.error
  }

  if (error) {
    const res2 = await admin.from('sales').select('*').limit(limit)
    data = res2.data
    error = res2.error
  }

  if (error) throw new Error(friendlyError(error.message))

  return (data || []).map((row) => {
    const unitPrice =
      Number(row.unit_price ?? row.sold_price ?? row.price ?? 0) || 0
    const unitCost =
      Number(row.unit_cost ?? row.buy_price ?? row.cost ?? 0) || 0
    const totalAmount =
      Number(row.total_amount ?? row.total_price ?? unitPrice * (Number(row.quantity) || 0)) ||
      0

    return {
      id: row.id,
      product_id: row.product_id,
      product_name: row.product_name || row.name || '',
      product_sku: row.product_sku || row.sku || '',
      quantity: Number(row.quantity) || 0,
      unit_price: unitPrice,
      unit_cost: unitCost,
      total_amount: totalAmount,
      sale_type: row.sale_type || 'cash',
      sold_by: row.sold_by,
      sold_by_email: row.sold_by_email,
      created_at: row.created_at || row.created || '',
    }
  })
}
