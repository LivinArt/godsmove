import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EditorialForm from '../../components/EditorialForm';

interface EditEditorialPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEditorialPage({ params }: EditEditorialPageProps) {
  const { id } = await params;

  const [post, products] = await Promise.all([
    prisma.archivePost.findUnique({ where: { id } }),
    prisma.product.findMany({
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
    }),
  ]);

  if (!post) {
    notFound();
  }

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.variants[0]?.price || 0),
  }));

  return <EditorialForm initialData={post} products={formattedProducts} />;
}
