import { useQuery } from '@tanstack/react-query';
import { transactionFormQueries } from 'src/services/transaction-form/application/queries';

export const useTransactionFormAccounts = (transactionId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getAccountsForSelector', transactionId],
    queryFn: () => transactionFormQueries.getAccountsForSelector(transactionId),
  });
  return data ?? [];
};
