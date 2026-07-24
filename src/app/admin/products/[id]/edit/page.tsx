import { getCategories, getProductById } from '@/actions/product.actions';
import { getDrops } from '@/actions/drop.actions';
import { ProductForm } from '../../components/ProductForm';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Edit Product · GODSMOVE Admin',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) notFound();

  const [product, categories, drops] = await Promise.all([
    getProductById(id),
    getCategories(),
    getDrops(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ProductForm
        initialData={product}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
        drops={drops.map(d => ({ id: d.id, name: d.name, slug: d.slug }))}
      />
    </div>
  );
}
