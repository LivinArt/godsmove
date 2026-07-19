import { getAdminReturnDetail } from '@/actions/admin-operations.actions';
import ReturnCRMClient from './ReturnCRMClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const returnDetail = await getAdminReturnDetail(id);
    return <ReturnCRMClient ret={returnDetail} />;
  } catch (err: any) {
    console.error('Failed to load return detail CRM view:', err);
    notFound();
  }
}
