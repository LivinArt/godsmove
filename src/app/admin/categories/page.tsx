import { getCategoriesWithProductCount } from '@/actions/product.actions';
import { CategoriesTable } from './components/CategoriesTable';

export const metadata = {
  title: 'Category Management · GODSMOVE Admin',
};

export default async function CategoriesAdminPage() {
  const categories = await getCategoriesWithProductCount();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-sub">
            Organize catalog structures · {categories.length} total categories
          </p>
        </div>
      </div>

      <CategoriesTable categories={categories} />
    </div>
  );
}
