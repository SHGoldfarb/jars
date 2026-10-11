import { createFileRoute } from '@tanstack/react-router';
import { SubcategoriesEdit } from 'components/SubcategoriesEdit';

export const Route = createFileRoute('/categories/subcategories/$subcategoryId/edit')({
  component: SubcategoriesEdit,
});
