import { ItemContent, ItemTitle } from 'components/ui/item';
import { useCategories } from 'src/hooks/useCategories';
import { useSubcategories } from 'src/hooks/useSubcategories';
import { GenericList } from './GenericList';

interface CategoryRow {
  id: string;
  name: string;
  url: string;
  isSubcategory: boolean;
}

const kindLabels = { income: 'Income', expense: 'Expense' } as const;

export const CategoriesList = ({ kind }: { kind: 'income' | 'expense' }) => {
  const { categories } = useCategories(kind);
  const { subcategories } = useSubcategories();

  // Each category is followed by its own subcategories, both already alphabetical. The rows are
  // flattened rather than nested because a list row is a link, and a link inside a link is not
  // markup a browser can make sense of - the indent is what carries the nesting.
  const rows: CategoryRow[] = categories.flatMap((category) => [
    {
      id: category.id,
      name: category.name,
      url: `/categories/${category.id}/edit`,
      isSubcategory: false,
    },
    ...subcategories
      .filter((subcategory) => subcategory.categoryId === category.id)
      .map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        url: `/categories/subcategories/${subcategory.id}/edit`,
        isSubcategory: true,
      })),
  ]);

  return (
    <GenericList
      items={rows}
      actions={[{ label: `Add ${kindLabels[kind]} category`, url: `/categories/${kind}/new` }]}
    >
      {(row) => (
        <ItemContent>
          <ItemTitle className={row.isSubcategory ? 'pl-6 text-muted-foreground' : undefined}>
            {row.name}
          </ItemTitle>
        </ItemContent>
      )}
    </GenericList>
  );
};
