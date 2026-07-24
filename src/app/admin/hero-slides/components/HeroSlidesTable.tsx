'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { moveHeroSlideDown, moveHeroSlideUp } from '@/actions/hero-slide.actions';
import type { HeroSlide } from '@prisma/client';

export default function HeroSlidesTable({ slides }: { slides: HeroSlide[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function up(id: string) {
    startTransition(async () => {
      await moveHeroSlideUp(id);
      router.refresh();
    });
  }

  function down(id: string) {
    startTransition(async () => {
      await moveHeroSlideDown(id);
      router.refresh();
    });
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Headline</th>
            <th>CTA</th>
            <th>Active</th>
            <th style={{ width: 200 }} />
          </tr>
        </thead>
        <tbody>
          {slides.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>
                No hero slides yet. Create one to replace the storefront fallback.
              </td>
            </tr>
          )}
          {slides.map((s, i) => (
            <tr key={s.id}>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '2px 8px' }}
                    disabled={pending || i === 0}
                    onClick={() => up(s.id)}
                    aria-label={`Move slide ${i + 1} up`}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '2px 8px' }}
                    disabled={pending || i === slides.length - 1}
                    onClick={() => down(s.id)}
                    aria-label={`Move slide ${i + 1} down`}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.headline}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 4 }}>{s.eyebrow}</div>
              </td>
              <td style={{ fontSize: 13 }}>
                <span className="mono">{s.ctaLabel}</span>
                <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 4 }}>{s.ctaHref}</div>
              </td>
              <td>
                <span className={s.isActive ? 'badge badge-green' : 'badge badge-grey'}>{s.isActive ? 'Yes' : 'No'}</span>
              </td>
              <td>
                <Link href={`/admin/hero-slides/${s.id}/edit`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
