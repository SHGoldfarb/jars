import { useQuery } from '@tanstack/react-query';
import { balances } from 'src/services/balances';

export const useAccountsTotal = (accountIds: readonly string[]) => {
  const { data } = useQuery({
    queryKey: ['balances.accountsTotal', accountIds],
    queryFn: () => balances.queries.accountsTotal(accountIds),
  });
  return data;
};
