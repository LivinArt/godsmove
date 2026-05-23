import Link from 'next/link';
import { getHeroSlidesAdmin } from '@/actions/hero-slide.actions';
import HeroSlidesTable from './components/HeroSlidesTable';

export default async function AdminHeroSlidesPage() {
  const slides = await getHeroSlidesAdmin();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Homepage hero</h1>
          <p className="page-sub">Cinematic slides · storefront order</p>
        </div>
        <Link href="/admin/hero-slides/new" className="btn-primary">
          + New slide
        </Link>
      </div>

      <HeroSlidesTable slides={slides} />
    </div>
  );
}
