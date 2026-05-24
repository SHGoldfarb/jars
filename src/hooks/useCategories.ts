import { getCategoriesExpense, getCategoriesIncome } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useCategoriesIncome = () => {
  const { data: categories } = useQuery({
    queryKey: ['getCategoriesIncome'],
    queryFn: () => getCategoriesIncome(),
  });

  return { categories: categories ?? [] };
};

export const useCategoriesExpense = () => {
  const { data: categories } = useQuery({
    queryKey: ['getCategoriesExpense'],
    queryFn: () => getCategoriesExpense(),
  });

  return { categories: categories ?? [] };
};
