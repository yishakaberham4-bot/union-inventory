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
  credit_customer_name?: string | null
  credit_phone?: string | null
  credit_amount?: number | null
  paid_amount?: number | null
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
    return 'Sales table not found. Please contact your system administrator.'
  }
  if (msg.includes('column') && msg.includes('does not exist')) {
    return `Database configuration issue: ${message}. Please contact your system administrator.`
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

  // Retry without credit-only columns if they don't exist yet
  if (msg.includes('column') || msg.includes('schema cache')) {
    const withoutCredit = { ...payload }
    delete withoutCredit.credit_customer_name
    delete withoutCredit.credit_phone
    delete withoutCredit.credit_amount
    delete withoutCredit.paid_amount
    ;({ error } = await admin.from('sales').insert(withoutCredit))
    if (!error) return null
  }

  // Retry without legacy-only columns
  if (msg.includes('column') || msg.includes('schema cache')) {
    const minimal = { ...payload }
    delete minimal.sold_price
    delete minimal.buy_price
    delete minimal.total_price
    delete minimal.credit_customer_name
    delete minimal.credit_phone
    delete minimal.credit_amount
    delete minimal.paid_amount
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

    // Credit fields
    const creditName = String(formData.get('credit_name') || '').trim()
    const creditPhone = String(formData.get('credit_phone') || '').trim()
    const creditMode = String(formData.get('credit_mode') || 'full')
      .trim()
      .toLowerCase()
    const paidHalfType = String(formData.get('paid_half_type') || 'cash')
      .trim()
      .toLowerCase()
    const paidHalfBank = String(formData.get('paid_half_bank') || '').trim()

    if (!productId) return { error: 'Please select a product' }
    if (isNaN(quantity) || quantity < 1) {
      return { error: 'Quantity must be at least 1' }
    }
    if (isNaN(unitPriceInput) || unitPriceInput < 0) {
      return { error: 'Enter a valid selling price (≥ 0)' }
    }
    if (!['cash', 'card', 'mb', 'credit'].includes(saleTypeRaw)) {
      return { error: 'Invalid sale type' }
    }
    if (saleTypeRaw === 'mb' && !bank) {
      return { error: 'Select which bank for MB payment' }
    }

    if (saleTypeRaw === 'credit') {
      if (!creditName) return { error: 'Enter the customer name for credit' }
      if (!creditPhone) return { error: 'Enter the customer phone number for credit' }
      if (!['full', 'two'].includes(creditMode)) {
        return { error: 'Invalid credit type' }
      }
      if (creditMode === 'two') {
        if (!['cash', 'card', 'mb'].includes(paidHalfType)) {
          return { error: 'Invalid payment type for the paid half' }
        }
        if (paidHalfType === 'mb' && !paidHalfBank) {
          return { error: 'Select which bank for the paid half (MB)' }
        }
      }
    }

    // Build sale_type string for storage
    let saleType: string
    let creditAmount = 0
    let paidAmount = 0

    if (saleTypeRaw === 'mb') {
      saleType = `mb:${bank}`
    } else if (saleTypeRaw === 'credit') {
      if (creditMode === 'full') {
        saleType = 'credit:full'
      } else {
        // two times
        const paidLabel =
          paidHalfType === 'mb' ? `mb:${paidHalfBank}` : paidHalfType
        saleType = `credit:two:${paidLabel}`
      }
    } else {
      saleType = saleTypeRaw
    }

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
    const halfAmount = Number((totalAmount / 2).toFixed(2))
    const newStock = stock - quantity

    if (saleTypeRaw === 'credit') {
      if (creditMode === 'full') {
        creditAmount = totalAmount
        paidAmount = 0
      } else {
        creditAmount = halfAmount
        paidAmount = halfAmount
      }
    } else {
      paidAmount = totalAmount
      creditAmount = 0
    }

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

    const basePayload: Record<string, unknown> = {
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
    }

    if (saleTypeRaw === 'credit') {
      basePayload.credit_customer_name = creditName
      basePayload.credit_phone = creditPhone
      basePayload.credit_amount = creditAmount
      basePayload.paid_amount = paidAmount
    }

    const saleErr = await insertSaleRow(admin, basePayload)

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

    let typeLabel: string
    if (saleTypeRaw === 'mb') {
      typeLabel = `MB (${bank})`
    } else if (saleTypeRaw === 'credit') {
      if (creditMode === 'full') {
        typeLabel = `Credit full (${creditName})`
      } else {
        const paidLbl =
          paidHalfType === 'mb' ? `MB (${paidHalfBank})` : paidHalfType
        typeLabel = `Credit two-times: paid ${halfAmount.toFixed(2)} via ${paidLbl}, credit ${halfAmount.toFixed(2)} (${creditName})`
      }
    } else {
      typeLabel = saleTypeRaw
    }

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

export type SalesReportOptions = {
  limit?: number
  /** ISO date string YYYY-MM-DD inclusive start (local day start UTC-ish) */
  from?: string | null
  /** ISO date string YYYY-MM-DD exclusive end, or inclusive end-of-day */
  to?: string | null
}

function mapSaleRow(row: any): SaleRow {
  const unitPrice =
    Number(row.unit_price ?? row.sold_price ?? row.price ?? 0) || 0
  const unitCost =
    Number(row.unit_cost ?? row.buy_price ?? row.cost ?? 0) || 0
  const totalAmount =
    Number(
      row.total_amount ??
        row.total_price ??
        unitPrice * (Number(row.quantity) || 0)
    ) || 0

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
    credit_customer_name: row.credit_customer_name ?? null,
    credit_phone: row.credit_phone ?? null,
    credit_amount:
      row.credit_amount != null ? Number(row.credit_amount) : null,
    paid_amount: row.paid_amount != null ? Number(row.paid_amount) : null,
  }
}

export async function getSalesReport(
  limitOrOpts: number | SalesReportOptions = 100
): Promise<SaleRow[]> {
  const opts: SalesReportOptions =
    typeof limitOrOpts === 'number' ? { limit: limitOrOpts } : limitOrOpts || {}
  const limit = opts.limit ?? 500
  const from = opts.from || null
  const to = opts.to || null

  const admin = getAdminClient()

  let data: any[] | null = null
  let error: { message: string } | null = null

  {
    let q = admin
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (from) {
      // start of day UTC for the given date
      q = q.gte('created_at', `${from}T00:00:00.000Z`)
    }
    if (to) {
      // exclusive end: next day 00:00 so "to" date is fully included
      q = q.lt('created_at', `${to}T00:00:00.000Z`)
    }

    const res = await q
    data = res.data
    error = res.error
  }

  // Fallback without date filters / order if schema issues
  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('column') || msg.includes('schema')) {
      const res2 = await admin.from('sales').select('*').limit(limit)
      data = res2.data
      error = res2.error
    }
  }

  if (error) throw new Error(friendlyError(error.message))

  let rows = (data || []).map(mapSaleRow)

  // Client-side date filter fallback if DB filter failed or dates missing timezone
  if (from || to) {
    rows = rows.filter((s) => {
      if (!s.created_at) return false
      const d = s.created_at.slice(0, 10) // YYYY-MM-DD
      if (from && d < from) return false
      if (to && d >= to) return false
      return true
    })
  }

  return rows
}

export interface ReturnedSaleRow {
  id: string
  original_sale_id: string | null
  product_id: string | null
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  unit_cost: number
  total_amount: number
  sale_type: string
  sold_by_email: string | null
  original_created_at: string | null
  returned_at: string
  reason: string | null
}

/**
 * Return a sale: restore stock, archive to sale_returns, delete from sales
 * so it disappears from every report.
 */
export async function returnSale(
  saleId: string,
  reason?: string
): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    if (!saleId) return { error: 'Sale ID is required' }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in to return a sale' }

    const admin = getAdminClient()

    const { data: sale, error: fetchErr } = await admin
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .maybeSingle()

    if (fetchErr) return { error: friendlyError(fetchErr.message) }
    if (!sale) return { error: 'Sale not found (may already have been returned)' }

    const productId = sale.product_id as string | null
    const qty = Number(sale.quantity) || 0
    if (qty < 1) return { error: 'Invalid sale quantity' }

    // Restore stock if product still exists
    if (productId) {
      const { data: product, error: prodErr } = await admin
        .from('products')
        .select('id, stock_qty, name')
        .eq('id', productId)
        .maybeSingle()

      if (prodErr) return { error: friendlyError(prodErr.message) }
      if (product) {
        const currentStock = Number(product.stock_qty) || 0
        const { error: stockErr } = await admin
          .from('products')
          .update({
            stock_qty: currentStock + qty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
        if (stockErr) return { error: friendlyError(stockErr.message) }
      }
    }

    const returnedByLabel =
      (user.user_metadata?.staff_id as string) ||
      user.email?.split('@')[0] ||
      user.email ||
      null

    const returnPayload: Record<string, unknown> = {
      original_sale_id: sale.id,
      product_id: productId,
      product_name: sale.product_name || '',
      product_sku: sale.product_sku || '',
      quantity: qty,
      unit_price: Number(sale.unit_price ?? sale.sold_price ?? 0) || 0,
      unit_cost: Number(sale.unit_cost ?? sale.buy_price ?? 0) || 0,
      total_amount:
        Number(sale.total_amount ?? sale.total_price ?? 0) || 0,
      sale_type: sale.sale_type || 'cash',
      sold_by: sale.sold_by ?? null,
      sold_by_email: sale.sold_by_email ?? null,
      original_created_at: sale.created_at ?? null,
      returned_at: new Date().toISOString(),
      returned_by: user.id,
      returned_by_email: returnedByLabel,
      reason: (reason || '').trim() || null,
    }

    // Archive to sale_returns (table must exist — see SQL on General report)
    const { error: insertErr } = await admin.from('sale_returns').insert(returnPayload)
    if (insertErr) {
      const msg = (insertErr.message || '').toLowerCase()
      if (msg.includes('relation') && msg.includes('does not exist')) {
        return {
          error:
            'Returns archive is not configured. Please contact your system administrator.',
        }
      }
      // Retry without optional columns
      if (msg.includes('column') || msg.includes('schema')) {
        const minimal = {
          original_sale_id: returnPayload.original_sale_id,
          product_id: returnPayload.product_id,
          product_name: returnPayload.product_name,
          product_sku: returnPayload.product_sku,
          quantity: returnPayload.quantity,
          unit_price: returnPayload.unit_price,
          unit_cost: returnPayload.unit_cost,
          total_amount: returnPayload.total_amount,
          sale_type: returnPayload.sale_type,
          original_created_at: returnPayload.original_created_at,
          returned_at: returnPayload.returned_at,
          reason: returnPayload.reason,
        }
        const { error: retryErr } = await admin.from('sale_returns').insert(minimal)
        if (retryErr) return { error: friendlyError(retryErr.message) }
      } else {
        return { error: friendlyError(insertErr.message) }
      }
    }

    // Delete from sales so it is removed from every report
    const { error: delErr } = await admin.from('sales').delete().eq('id', saleId)
    if (delErr) {
      return {
        error: friendlyError(
          `Stock restored and return logged, but could not delete sale: ${delErr.message}`
        ),
      }
    }

    try {
      revalidatePath('/admin/sales')
      revalidatePath('/admin/sales/report')
      revalidatePath('/admin/sales/profit')
      revalidatePath('/admin/sales/credit')
      revalidatePath('/admin/sales/transactions')
      revalidatePath('/admin/sales/graphics')
      revalidatePath('/admin/inventory')
      revalidatePath('/admin/inventory/stock')
      revalidatePath('/sales/report')
      revalidatePath('/sales/make')
      revalidatePath('/sales/pos')
    } catch {
      // ignore
    }

    const name = (sale.product_name as string) || 'product'
    return {
      success: true,
      message: `Returned ${qty} × ${name} to stock. Sale removed from all reports.`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Return failed'
    return { error: friendlyError(msg) }
  }
}

export async function getReturnedSales(limit = 500): Promise<ReturnedSaleRow[]> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('sale_returns')
    .select('*')
    .order('returned_at', { ascending: false })
    .limit(limit)

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('relation') && msg.includes('does not exist')) {
      return []
    }
    throw new Error(friendlyError(error.message))
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    original_sale_id: row.original_sale_id ?? null,
    product_id: row.product_id ?? null,
    product_name: row.product_name || '',
    product_sku: row.product_sku || '',
    quantity: Number(row.quantity) || 0,
    unit_price: Number(row.unit_price) || 0,
    unit_cost: Number(row.unit_cost) || 0,
    total_amount: Number(row.total_amount) || 0,
    sale_type: row.sale_type || 'cash',
    sold_by_email: row.sold_by_email ?? row.returned_by_email ?? null,
    original_created_at: row.original_created_at ?? null,
    returned_at: row.returned_at || '',
    reason: row.reason ?? null,
  }))
}
