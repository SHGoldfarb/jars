import { useQuery } from '@tanstack/react-query';
import { transactionForm } from 'src/services/transaction-form';

export const useTransactionFormJars = (transactionId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getJarsForSelector', transactionId],
    queryFn: () => transactionForm.queries.getJarsForSelector(transactionId),
  });
  return data ?? [];
};
