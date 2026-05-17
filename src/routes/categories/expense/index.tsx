import { createFileRoute } from '@tanstack/react-router';
import { CategoriesExpense } from 'src/components/CategoriesExpense';

export const Route = createFileRoute('/categories/expense/')({
  component: CategoriesExpense,
});
