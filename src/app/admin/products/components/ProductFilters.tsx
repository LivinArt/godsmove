'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface ProductFiltersProps {
  q?: string;
  destination?: string;
  category?: string;
  collection?: string;
  badge?: string;
  status?: string;
  categories: { id: string; name: string }[];
  collections: (string | { name: string })[];
  knownBadges: string[];
}

export function ProductFilters({
  q,
  destination,
  category,
  collection,
  badge,
  status,
  categories,
  collections,
  knownBadges,
}: ProductFiltersProps) {
  const router = useRouter();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/products?${params.toString()}`);
  };

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 items-center">
      <form
        className="flex-1 w-full relative"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const searchVal = formData.get('q')?.toString() || '';
          handleFilterChange('q', searchVal);
        }}
      >
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
        <select
          name="category"
          value={category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="bg-black border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Collection Filter */}
        <select
          name="collection"
          value={collection || ''}
          onChange={(e) => handleFilterChange('collection', e.target.value)}
          className="bg-black border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="">All Collections</option>
          {collections.map((col) => {
            const cName = typeof col === 'string' ? col : col.name;
            return (
              <option key={cName} value={cName}>
                {cName}
              </option>
            );
          })}
        </select>

        {/* Badge Filter */}
        <select
          name="badge"
          value={badge || ''}
          onChange={(e) => handleFilterChange('badge', e.target.value)}
          className="bg-black border border-white/10 text-xs text-white rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
        >
          <option value="">All Badges</option>
          {knownBadges.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* Clear Filters Link if any filter active */}
        {(destination || category || collection || badge || q || status) && (
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="text-xs text-[#c8a46a] hover:underline px-2 py-2 cursor-pointer bg-transparent border-none"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
