import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useAccount = (accountId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getAccountById', accountId],
    queryFn: () => financeQueries.accounts.getById(accountId),
  });
  return data;
};
