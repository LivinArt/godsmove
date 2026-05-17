import { getDiscountById } from '@/actions/discount.actions';
import { getProducts } from '@/actions/product.actions';
import { DiscountForm } from '../../components/DiscountForm';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Edit Discount · GODSMOVE Admin',
};

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [discount, allProducts] = await Promise.all([
    getDiscountById(id),
    getProducts({ take: 200 }),
  ]);

  if (!discount) notFound();

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <DiscountForm
        initialData={{
          ...discount,
          value: discount.value.toString(),
          minimumOrderValue: discount.minimumOrderValue?.toString() ?? null,
          maximumDiscount: discount.maximumDiscount?.toString() ?? null,
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
