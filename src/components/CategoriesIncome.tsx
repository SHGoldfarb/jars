import { GenericNameableList } from 'src/components/GenericNameableList';
import { useCategoriesIncome } from 'src/hooks/useCategories';

export const CategoriesIncome = () => {
  const { categories } = useCategoriesIncome();

  return (
    <GenericNameableList
      items={categories.map((category) => ({
        ...category,
        url: `/categories/${category.id}/edit`,
      }))}
      actions={[{ label: 'Add Income category', url: '/categories/income/new' }]}
    />
  );
};
