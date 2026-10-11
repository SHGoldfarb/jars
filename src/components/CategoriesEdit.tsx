import { Link, useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { useParams } from '@tanstack/react-router';
import { useCategory } from 'src/hooks/useCategory';
import { Button } from 'src/components/ui/button';
import { GenericNameForm } from './GenericNameForm';

export const CategoriesEdit = () => {
  const { categoryId } = useParams({ strict: false });
  const category = useCategory(categoryId ?? '');
  const navigate = useNavigate();

  if (!category) {
    return null;
  }

  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.categories.rename({ categoryId: category.id, name });
      await navigate({ to: `/categories/${category.kind}` });
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await financeCommands.categories.archive({ categoryId: category.id });
      await navigate({ to: `/categories/${category.kind}` });
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  return (
    <>
      <GenericNameForm
        title="Edit Category"
        onSubmit={(name) => {
          void handleSubmit(name);
        }}
        onCancelRoute={`/categories/${category.kind}`}
        initialName={category.name}
        onDelete={() => {
          void handleDelete();
        }}
        fieldName="categoryName"
        placeholder=""
      />
      {/* Subcategories are managed from the category they belong to, so this is the only way in
          to creating one. */}
      {/*TODO: maybe it would be better to add optional actions to the GenericNameForm component
        instead of adding a button here*/}
      <div className="w-full max-w-md px-6 pb-6">
        <Link to="/categories/$categoryId/subcategories/new" params={{ categoryId: category.id }}>
          <Button variant="outline" type="button">
            Add subcategory
          </Button>
        </Link>
      </div>
    </>
  );
};
