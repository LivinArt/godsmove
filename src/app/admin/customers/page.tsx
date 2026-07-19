import { getAdminCustomers } from '@/actions/admin-customer.actions';
import CustomersListClient from './CustomersListClient';

export const dynamic = 'force-dynamic';

export default async function CustomersAdminPage() {
  const customers = await getAdminCustomers();

  return <CustomersListClient initialCustomers={customers} />;
}
