import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useCategoriesIncome = () => {
  const { data: categories } = useQuery({
    queryKey: ['financeQueries.listCategoriesIncome'],
    queryFn: () => financeQueries.listCategoriesIncome(),
  });

  return { categories: categories ?? [] };
};

export const useCategoriesExpense = () => {
  const { data: categories } = useQuery({
    queryKey: ['financeQueries.listCategoriesExpense'],
    queryFn: () => financeQueries.listCategoriesExpense(),
  });

  return { categories: categories ?? [] };
};

export const useCategories = (kind: 'income' | 'expense') => {
  const { categories: incomeCategories } = useCategoriesIncome();
  const { categories: expenseCategories } = useCategoriesExpense();
  return { categories: kind === 'income' ? incomeCategories : expenseCategories };
};
