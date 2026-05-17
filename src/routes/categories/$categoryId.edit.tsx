import { createFileRoute } from '@tanstack/react-router';
import { CategoriesEdit } from 'components/CategoriesEdit';

export const Route = createFileRoute('/categories/$categoryId/edit')({
  component: CategoriesEdit,
});
