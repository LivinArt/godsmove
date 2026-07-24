import { getProducts } from '@/actions/product.actions';
import { DiscountForm } from '../components/DiscountForm';

export const metadata = {
  title: 'New Discount · GODSMOVE Admin',
};

export default async function NewDiscountPage() {
  const allProducts = await getProducts({ take: 200 });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <DiscountForm
        allProducts={allProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          status: p.status,
        }))}
      />
    </div>
  );
}
