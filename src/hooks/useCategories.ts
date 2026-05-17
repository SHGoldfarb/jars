import { getCategoriesExpense, getCategoriesIncome } from 'src/services/finance';
import { useLiveQuery } from 'dexie-react-hooks';

export const useCategoriesIncome = () => {
  const categories = useLiveQuery(() => getCategoriesIncome());
  const loading = categories === undefined;

  return { categories: categories ?? [], loading };
};

export const useCategoriesExpense = () => {
  const categories = useLiveQuery(() => getCategoriesExpense());
  const loading = categories === undefined;

  return { categories: categories ?? [], loading };
};
