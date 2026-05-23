import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getHeroSlideById } from '@/actions/hero-slide.actions';
import HeroSlideForm from '../../components/HeroSlideForm';

export default async function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slide = await getHeroSlideById(id);
  if (!slide) notFound();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit hero slide</h1>
          <p className="page-sub mono" style={{ fontSize: 12 }}>
            {slide.id}
          </p>
        </div>
        <Link href="/admin/hero-slides" className="btn-secondary">
          Back to list
        </Link>
      </div>
      <HeroSlideForm initialData={slide} />
    </div>
  );
}
