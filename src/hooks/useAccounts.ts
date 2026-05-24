import { getAccounts } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useAccounts = () => {
  const { data } = useQuery({ queryKey: ['getAccounts'], queryFn: () => getAccounts() });

  return { accounts: data ?? [] };
};
