import { useQuery } from '@tanstack/react-query';
import { transactionFormQueries } from 'src/services/transaction-form/application/queries';

export const useTransactionFormCategories = (
  kind: 'income' | 'expense' | '',
  transactionId: string | undefined
) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getCategoriesForSelector', kind, transactionId],
    queryFn: () =>
      kind ? transactionFormQueries.getCategoriesForSelector(kind, transactionId) : [],
    enabled: kind !== '',
  });
  return data ?? [];
};
