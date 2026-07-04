import { useQuery } from '@tanstack/react-query';
import { transactionFormQueries } from 'src/services/transaction-form/application/queries';

export const useTransactionFormJars = (transactionId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getJarsForSelector', transactionId],
    queryFn: () => transactionFormQueries.getJarsForSelector(transactionId),
  });
  return data ?? [];
};
