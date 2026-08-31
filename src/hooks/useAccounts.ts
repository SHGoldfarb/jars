import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useAccounts = () => {
  const { data } = useQuery({
    queryKey: ['financeQueries.listAccounts'],
    queryFn: () => financeQueries.accounts.list(),
  });

  return { accounts: data ?? [] };
};
