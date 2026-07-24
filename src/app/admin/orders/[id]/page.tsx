import { getAdminOrderDetail } from '@/actions/admin-operations.actions';
import OrderCRMClient from './OrderCRMClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const order = await getAdminOrderDetail(id);
    return <OrderCRMClient order={order} />;
  } catch (err: any) {
    console.error('Failed to load order CRM detail view:', err);
    notFound();
  }
}
