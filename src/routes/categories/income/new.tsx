import { createFileRoute } from '@tanstack/react-router';
import { CategoriesIncomeNew } from 'components/CategoriesIncomeNew';

export const Route = createFileRoute('/categories/income/new')({
  component: CategoriesIncomeNew,
});
