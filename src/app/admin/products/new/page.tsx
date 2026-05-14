import { getCategories, getDrops } from '@/actions/product.actions';
import { ProductForm } from '../components/ProductForm';

export const metadata = {
  title: 'New Product · GODSMOVE Admin',
};

export default async function NewProductPage() {
  const [categories, drops] = await Promise.all([
    getCategories(),
    getDrops(),
  ]);

  // Pass necessary data to the client component
  return (
    <div className="max-w-6xl mx-auto">
      <ProductForm
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
        drops={drops.map(d => ({ id: d.id, name: d.name, slug: d.slug, season: d.season }))}
      />
    </div>
  );
}
