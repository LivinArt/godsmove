import Link from 'next/link';
import HeroSlideForm from '../components/HeroSlideForm';
import pageStyles from '../heroSlideEditorPage.module.css';

export default function NewHeroSlidePage() {
  return (
    <div className={pageStyles.page}>
      <div className="page-header">
        <div>
          <h1 className="page-title">New hero slide</h1>
          <p className="page-sub">Desktop + optional mobile imagery, copy, CTA</p>
        </div>
        <Link href="/admin/hero-slides" className="btn-secondary">
          Cancel
        </Link>
      </div>
      <HeroSlideForm />
    </div>
  );
}
