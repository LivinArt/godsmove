import { getProducts, getCategories, getDrops } from '@/actions/product.actions';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { ProductsTable } from './components/ProductsTable';

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; drop?: string }>;
}) {
  const { q, status, category, drop } = await searchParams;

  const [products] = await Promise.all([
    getProducts({
      search: q,
      status: status,
      categoryId: category,
      dropId: drop,
    }),
    // categories and drops fetched here if needed for future filters
  ]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">{products.length} products found</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          + New Product
        </Link>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-[#111] p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row gap-4 items-center">
        <form className="flex-1 w-full relative" method="GET">
          {status && <input type="hidden" name="status" value={status} />}
          {category && <input type="hidden" name="category" value={category} />}
          {drop && <input type="hidden" name="drop" value={drop} />}

          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Search products by name, slug, or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:border-white text-sm"
          />
        </form>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Link
            href="/admin/products"
            className={`px-4 py-2 text-sm rounded-lg border whitespace-nowrap ${!status ? 'bg-white text-black border-white' : 'bg-black text-white border-white/10 hover:border-white/30'}`}
          >
            All
          </Link>
          <Link
            href={`?status=ACTIVE${q ? `&q=${q}` : ''}`}
            className={`px-4 py-2 text-sm rounded-lg border whitespace-nowrap ${status === 'ACTIVE' ? 'bg-white text-black border-white' : 'bg-black text-white border-white/10 hover:border-white/30'}`}
          >
            Active
          </Link>
          <Link
            href={`?status=DRAFT${q ? `&q=${q}` : ''}`}
            className={`px-4 py-2 text-sm rounded-lg border whitespace-nowrap ${status === 'DRAFT' ? 'bg-white text-black border-white' : 'bg-black text-white border-white/10 hover:border-white/30'}`}
          >
            Drafts
          </Link>
          <Link
            href={`?status=ARCHIVED${q ? `&q=${q}` : ''}`}
            className={`px-4 py-2 text-sm rounded-lg border whitespace-nowrap ${status === 'ARCHIVED' ? 'bg-white text-black border-white' : 'bg-black text-white border-white/10 hover:border-white/30'}`}
          >
            Archived
          </Link>
        </div>
      </div>

      {/* Table — client component owns delete state + modal */}
      <ProductsTable products={products} />
    </div>
  );
}
