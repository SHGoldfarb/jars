import { useQuery } from '@tanstack/react-query';
import { transactionFormQueries } from 'src/services/transaction-form/application/queries';

export const useTransactionFormAccounts = (transactionAccountId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transactionFormQueries.getAccountsForSelector', transactionAccountId],
    queryFn: () => transactionFormQueries.getAccountsForSelector(transactionAccountId),
  });
  return data ?? [];
};
