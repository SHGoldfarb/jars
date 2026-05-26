import { getTransactions } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useTransactions = () => {
  const { data } = useQuery({ queryKey: ['getTransactions'], queryFn: () => getTransactions() });

  return { transactions: data ?? [] };
};
