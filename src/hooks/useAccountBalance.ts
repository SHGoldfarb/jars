import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useAccountBalance = (accountId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getAccountBalance', accountId],
    queryFn: () => financeQueries.getAccountBalance(accountId),
  });
  return data;
};
