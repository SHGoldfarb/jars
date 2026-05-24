import { getAccount } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useAccount = (accountId: string) => {
  const { data } = useQuery({
    queryKey: ['getAccount', accountId],
    queryFn: () => getAccount(accountId),
  });
  return data;
};
