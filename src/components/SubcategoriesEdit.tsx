import { useNavigate, useParams, type LinkProps } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { useCategory } from 'src/hooks/useCategory';
import { useSubcategory } from 'src/hooks/useSubcategory';
import { GenericNameForm } from './GenericNameForm';

export const SubcategoriesEdit = () => {
  const { subcategoryId } = useParams({ strict: false });
  const subcategory = useSubcategory(subcategoryId ?? '');
  const category = useCategory(subcategory?.categoryId ?? '');
  const navigate = useNavigate();

  if (!subcategory || !category) {
    return null;
  }

  const listRoute: LinkProps['to'] = `/categories/${category.kind}`;

  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.subcategories.rename({ subcategoryId: subcategory.id, name });
      await navigate({ to: listRoute });
    } catch (error) {
      console.error('Failed to update subcategory:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await financeCommands.subcategories.archive({ subcategoryId: subcategory.id });
      await navigate({ to: listRoute });
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
    }
  };

  return (
    <GenericNameForm
      title="Edit Subcategory"
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute={listRoute}
      initialName={subcategory.name}
      onDelete={() => {
        void handleDelete();
      }}
      fieldName="subcategoryName"
      placeholder=""
    />
  );
};
