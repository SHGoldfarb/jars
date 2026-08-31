import { useQuery } from '@tanstack/react-query';
import { transactionForm } from 'src/services/transaction-form';

export const useTransactionFormCategories = (
  kind: 'income' | 'expense' | '',
  transactionId: string | undefined
) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getCategoriesForSelector', kind, transactionId],
    queryFn: () =>
      kind ? transactionForm.queries.getCategoriesForSelector(kind, transactionId) : [],
    enabled: kind !== '',
  });
  return data ?? [];
};
