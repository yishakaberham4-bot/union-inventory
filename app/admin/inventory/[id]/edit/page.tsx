import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductById } from '@/app/actions/products'
import { EditProductForm } from './edit-form'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let product = null
  try {
    product = await getProductById(id)
  } catch {
    // fall through
  }
  if (!product) notFound()

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <Link href="/admin/inventory" className="text-slate-400 hover:text-white text-sm">
            ← Inventory
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">Edit product</h1>
          <p className="text-slate-400 text-sm font-mono">{product.sku}</p>
        </div>
        <EditProductForm product={product} />
      </div>
    </div>
  )
}
