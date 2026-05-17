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
      addLabel="Add Income category"
      addUrl="/categories/income/new"
    />
  );
};
