import { createFileRoute } from '@tanstack/react-router';
import { SubcategoriesNew } from 'components/SubcategoriesNew';

export const Route = createFileRoute('/categories/$categoryId/subcategories/new')({
  component: SubcategoriesNew,
});
