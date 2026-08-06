import { getProducts, getCategories } from '@/actions/product.actions';
import { getCollections } from '@/actions/collection.actions';
import Link from 'next/link';
import { ProductsTable } from './components/ProductsTable';
import { ProductFilters } from './components/ProductFilters';

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
  const { q, destination, category, collection, badge, status } = (await searchParams) || {};

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

      {/* Multi-Filter & Search Controls Client Component */}
      <ProductFilters
        q={q}
        destination={destination}
        category={category}
        collection={collection}
        badge={badge}
        status={status}
        categories={categories}
        collections={collections}
        knownBadges={knownBadges}
      />

      {/* Products Table with Refined Columns */}
      <ProductsTable products={products} />
    </div>
  );
}

