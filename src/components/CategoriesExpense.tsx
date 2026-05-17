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
      addLabel="Add Expense category"
      addUrl="/categories/expense/new"
    />
  );
};
