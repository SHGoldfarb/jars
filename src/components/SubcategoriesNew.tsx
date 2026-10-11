import { useNavigate, useParams, type LinkProps } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { useCategory } from 'src/hooks/useCategory';
import { GenericNameForm } from './GenericNameForm';

export const SubcategoriesNew = () => {
  const { categoryId } = useParams({ strict: false });
  const category = useCategory(categoryId ?? '');
  const navigate = useNavigate();

  if (!category) {
    return null;
  }

  // Back to the tab the parent category lives in: a subcategory has no screen of its own, and
  // its kind is the one it inherits.
  const listRoute: LinkProps['to'] = `/categories/${category.kind}`;

  const handleSubmit = async (name: string) => {
    try {
      await financeCommands.subcategories.create({ categoryId: category.id, name });
      await navigate({ to: listRoute });
    } catch (error) {
      console.error('Failed to create subcategory:', error);
    }
  };

  return (
    <GenericNameForm
      title={`Create Subcategory of ${category.name}`}
      onSubmit={(name) => {
        void handleSubmit(name);
      }}
      onCancelRoute={listRoute}
      fieldName="subcategoryName"
      placeholder=""
    />
  );
};
