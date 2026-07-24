import { getCollections } from '@/actions/collection.actions';
import { CollectionsTable } from './components/CollectionsTable';

export const metadata = {
  title: 'Collection Management · GODSMOVE Admin',
};

export default async function CollectionsAdminPage() {
  const collections = await getCollections();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Collection Management</h1>
          <p className="page-sub">
            Manage curated collection groupings · {collections.length} total collections
          </p>
        </div>
      </div>

      <CollectionsTable collections={collections} />
    </div>
  );
}
