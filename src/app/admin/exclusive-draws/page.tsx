import Link from 'next/link';
import { getAdminExclusiveDraws } from '@/actions/exclusive.actions';
import { ExclusiveDrawsTable } from './components/ExclusiveDrawsTable';

export const metadata = { title: 'Exclusive Draws — GODSMOVE Admin' };

export default async function ExclusiveDrawsPage() {
  const { draws, total } = await getAdminExclusiveDraws({ take: 50 });

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="admin-page-title">Exclusive Draws</h1>
          <p className="admin-page-subtitle">{total} campaign{total !== 1 ? 's' : ''} tracked</p>
        </div>
        <Link href="/admin/products" className="btn-secondary">
          Manage Products
        </Link>
      </div>
      <ExclusiveDrawsTable draws={draws as any} />
    </div>
  );
}
