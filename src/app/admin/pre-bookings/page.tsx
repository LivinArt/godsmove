import { getAdminPreBookingsData } from '@/actions/admin-prebookings.actions';
import PreBookingsAdminClient from './PreBookingsAdminClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pre-Booking Management | GODSMOVE Admin',
};

export default async function AdminPreBookingsPage() {
  const data = await getAdminPreBookingsData();
  return <PreBookingsAdminClient initialData={data} />;
}
