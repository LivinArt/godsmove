import { prisma } from '@/lib/prisma';
import EditorialForm from '../components/EditorialForm';

export default async function NewEditorialPage() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      slug: true,
      variants: {
        take: 1,
        select: { price: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.variants[0]?.price || 0),
  }));

  return <EditorialForm products={formattedProducts} />;
}
