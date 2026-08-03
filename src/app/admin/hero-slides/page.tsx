import Link from 'next/link';
import { getHeroSlidesAdmin } from '@/actions/hero-slide.actions';
import { getHomepageFeatureCardsData } from '@/actions/feature-cards.actions';
import HeroSlidesTable from './components/HeroSlidesTable';
import HomepageFeatureCardsAdmin from './components/HomepageFeatureCardsAdmin';

export default async function AdminHeroSlidesPage() {
  const [slides, featureCardsContent] = await Promise.all([
    getHeroSlidesAdmin(),
    getHomepageFeatureCardsData(),
  ]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Homepage hero & features</h1>
          <p className="page-sub">Cinematic slides · homepage feature section</p>
        </div>
        <Link href="/admin/hero-slides/new" className="btn-primary">
          + New slide
        </Link>
      </div>

      <HeroSlidesTable slides={slides} />

      <HomepageFeatureCardsAdmin initialContent={featureCardsContent} />
    </div>
  );
}
