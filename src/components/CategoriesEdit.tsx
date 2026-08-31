import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { useParams } from '@tanstack/react-router';
import { useCategory } from 'src/hooks/useCategory';
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
  );
};
