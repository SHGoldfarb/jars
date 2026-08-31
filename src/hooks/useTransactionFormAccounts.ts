import { useQuery } from '@tanstack/react-query';
import { transactionForm } from 'src/services/transaction-form';

export const useTransactionFormAccounts = (transactionId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getAccountsForSelector', transactionId],
    queryFn: () => transactionForm.queries.getAccountsForSelector(transactionId),
  });
  return data ?? [];
};
