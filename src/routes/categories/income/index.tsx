import { createFileRoute } from '@tanstack/react-router';
import { CategoriesIncome } from 'src/components/CategoriesIncome';

export const Route = createFileRoute('/categories/income/')({
  component: CategoriesIncome,
});
