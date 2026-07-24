import { getAdminInventory } from '@/actions/admin-operations.actions';
import InventoryCRMClient from './InventoryCRMClient';

export const dynamic = 'force-dynamic';

export default async function InventoryAdminPage() {
  const inventory = await getAdminInventory();

  return <InventoryCRMClient initialInventory={inventory} />;
}
