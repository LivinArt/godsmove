import { getAdminCustomerDetail } from '@/actions/admin-customer.actions';
import CustomerCRMClient from './CustomerCRMClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CustomerCRMDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const customer = await getAdminCustomerDetail(id);
    return <CustomerCRMClient customer={customer} />;
  } catch (err: any) {
    console.error('Failed to load customer CRM page details:', err);
    notFound();
  }
}
