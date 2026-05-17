import { createFileRoute } from '@tanstack/react-router';
import { CategoriesExpenseNew } from 'components/CategoriesExpenseNew';

export const Route = createFileRoute('/categories/expense/new')({
  component: CategoriesExpenseNew,
});
