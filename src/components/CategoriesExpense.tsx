import { GenericNameableList } from 'src/components/GenericNameableList';
import { useCategoriesExpense } from 'src/hooks/useCategories';

export const CategoriesExpense = () => {
  const { categories } = useCategoriesExpense();

  return (
    <GenericNameableList
      items={categories.map((category) => ({
        ...category,
        url: `/categories/${category.id}/edit`,
      }))}
      actions={[{ label: 'Add Expense category', url: '/categories/expense/new' }]}
    />
  );
};
