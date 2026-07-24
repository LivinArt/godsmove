import { getDropById } from '@/actions/drop.actions';
import { getProducts } from '@/actions/product.actions';
import { DropForm } from '../../components/DropForm';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Edit Drop · GODSMOVE Admin',
};

export default async function EditDropPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [drop, allProducts] = await Promise.all([
    getDropById(id),
    getProducts({ take: 200 }),
  ]);

  if (!drop) notFound();

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <DropForm
        initialData={{
          id: drop.id,
          name: drop.name,
          slug: drop.slug,
          tagline: drop.tagline,
          description: drop.description,
          manifesto: drop.manifesto,
          heroImageUrl: drop.heroImageUrl,
          launchAt: drop.launchAt,
          endAt: drop.endAt,
          status: drop.status,
          isFeatured: drop.isFeatured,
          showCountdown: drop.showCountdown,
          maxUnits: drop.maxUnits,
          products: drop.products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            status: p.status,
          })),
        }}
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
