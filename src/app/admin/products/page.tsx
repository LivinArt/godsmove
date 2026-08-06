import { getProducts, getCategories } from '@/actions/product.actions';
import { getCollections } from '@/actions/collection.actions';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { ProductsTable } from './components/ProductsTable';

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    destination?: string;
    category?: string;
    collection?: string;
    badge?: string;
    status?: string;
  }>;
}) {
  const { q, destination, category, collection, badge, status } = await searchParams;

  const [products, categories, collections] = await Promise.all([
    getProducts({
      search: q,
      destination: destination,
      categoryId: category,
      collectionName: collection,
      featuredBadge: badge,
      status: status,
    }),
    getCategories(),
    getCollections(),
  ]);

  // Extract unique badges from products for badge filter options
  const knownBadges = ['Editor\'s Pick', 'Limited', 'Signature', 'Archive', 'Exclusive', 'Members Only'];

  const buildQuery = (newParams: Record<string, string | undefined>) => {
    const current = {
      q,
      destination,
      category,
      collection,
      badge,
      status,
      ...newParams,
    };
    const params = new URLSearchParams();
    Object.entries(current).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const str = params.toString();
    return str ? `?${str}` : '/admin/products';
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">{products.length} products listed</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          + New Product
        </Link>
      </div>

      {/* Destination Tabs Bar */}
      <div className="flex border-b border-white/10 gap-6 pb-2">
        <Link
          href={buildQuery({ destination: undefined })}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            !destination || destination === 'all'
              ? 'border-[#c8a46a] text-[#c8a46a]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          All Listing Destinations
        </Link>
        <Link
          href={buildQuery({ destination: 'drops' })}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            destination === 'drops'
              ? 'border-[#c8a46a] text-[#c8a46a]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Drops
        </Link>
        <Link
          href={buildQuery({ destination: 'exclusive_rack' })}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            destination === 'exclusive_rack'
              ? 'border-[#c8a46a] text-[#c8a46a]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Exclusive Rack
        </Link>
      </div>

      {/* Multi-Filter & Search Controls */}
      <div className="bg-[#111] p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 items-center">
        <form className="flex-1 w-full relative" method="GET">
          {destination && <input type="hidden" name="destination" value={destination} />}
          {category && <input type="hidden" name="category" value={category} />}
          {collection && <input type="hidden" name="collection" value={collection} />}
          {badge && <input type="hidden" name="badge" value={badge} />}
          {status && <input type="hidden" name="status" value={status} />}

          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Search by product name, slug, or SKU..."
            className="w-full pl-9 pr-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:border-white text-xs"
          />
        </form>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {/* Category Filter */}
          <form method="GET">
            {q && <input type="hidden" name="q" value={q} />}
            {destination && <input type="hidden" name="destination" value={destination} />}
            {collection && <input type="hidden" name="collection" value={collection} />}
            {badge && <input type="hidden" name="badge" value={badge} />}
            {status && <input type="hidden" name="status" value={status} />}
            <select
              name="category"
              defaultValue={category || ''}
              onChange={(e) => e.target.form?.submit()}
              className="bg-black border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </form>

          {/* Collection Filter */}
          <form method="GET">
            {q && <input type="hidden" name="q" value={q} />}
            {destination && <input type="hidden" name="destination" value={destination} />}
            {category && <input type="hidden" name="category" value={category} />}
            {badge && <input type="hidden" name="badge" value={badge} />}
            {status && <input type="hidden" name="status" value={status} />}
            <select
              name="collection"
              defaultValue={collection || ''}
              onChange={(e) => e.target.form?.submit()}
              className="bg-black border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">All Collections</option>
              {collections.map((col: any) => {
                const cName = typeof col === 'string' ? col : col.name;
                return (
                  <option key={cName} value={cName}>
                    {cName}
                  </option>
                );
              })}
            </select>
          </form>

          {/* Badge Filter */}
          <form method="GET">
            {q && <input type="hidden" name="q" value={q} />}
            {destination && <input type="hidden" name="destination" value={destination} />}
            {category && <input type="hidden" name="category" value={category} />}
            {collection && <input type="hidden" name="collection" value={collection} />}
            {status && <input type="hidden" name="status" value={status} />}
            <select
              name="badge"
              defaultValue={badge || ''}
              onChange={(e) => e.target.form?.submit()}
              className="bg-black border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">All Badges</option>
              {knownBadges.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </form>

          {/* Clear Filters Link if any filter active */}
          {(destination || category || collection || badge || q || status) && (
            <Link
              href="/admin/products"
              className="text-xs text-[#c8a46a] hover:underline px-2 py-2"
            >
              Reset
            </Link>
          )}
        </div>
      </div>

      {/* Products Table with Refined Columns */}
      <ProductsTable products={products} />
    </div>
  );
}

