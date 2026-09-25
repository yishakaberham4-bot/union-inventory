import Link from 'next/link'
import { getAvailableProductsForSale } from '@/app/actions/sales'
import MakeSaleForm from './make-sale-form'

export default async function MakeSalePage() {
  let products: Awaited<ReturnType<typeof getAvailableProductsForSale>> = []
  let loadError: string | null = null

  try {
    products = await getAvailableProductsForSale()
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load products'
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Make Sale</h1>
          <p className="text-sm text-slate-400 mt-1">
            Choose product, quantity and sale type
          </p>
        </div>
        <Link
          href="/sales/pos"
          className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          ← Back
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-800/50 bg-red-950/40 p-5 text-red-200 text-sm space-y-3">
          <p>{loadError}</p>
          <p className="text-red-300/80 text-xs">
            If this mentions a missing table, run the SQL below in Supabase → SQL Editor
            (products table must exist first).
          </p>
        </div>
      ) : (
        <MakeSaleForm products={products} />
      )}

      <details className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400">
        <summary className="cursor-pointer text-slate-300 font-medium">
          Required SQL (sales table) — run once in Supabase
        </summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
{`create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  sale_type text not null default 'cash',
  sold_by uuid,
  sold_by_email text,
  created_at timestamptz default now()
);

create index if not exists sales_created_at_idx on public.sales (created_at desc);`}
        </pre>
      </details>
    </div>
  )
}
