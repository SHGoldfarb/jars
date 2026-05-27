import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useTransactions = () => {
  const { data } = useQuery({
    queryKey: ['financeQueries.listTransactions'],
    queryFn: () => financeQueries.listTransactions(),
  });

  return { transactions: data ?? [] };
};
