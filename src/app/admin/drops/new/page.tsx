import { getProducts } from '@/actions/product.actions';
import { DropForm } from '../components/DropForm';

export const metadata = {
  title: 'New Drop · GODSMOVE Admin',
};

export default async function NewDropPage() {
  const allProducts = await getProducts({ take: 200 });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <DropForm
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
