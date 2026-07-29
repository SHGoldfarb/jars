import { useQuery } from '@tanstack/react-query';
import { balances } from 'src/services/balances';

export const useAccountBalance = (accountId: string) => {
  const { data } = useQuery({
    queryKey: ['financeQueries.getAccountBalance', accountId],
    queryFn: () => balances.queries.accounts(accountId),
  });
  return data;
};
