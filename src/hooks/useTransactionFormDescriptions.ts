import { useQuery } from '@tanstack/react-query';
import { financeQueries } from 'src/services/finance';

export const useTransactionFormDescriptions = () => {
  const { data } = useQuery({
    queryKey: ['financeQueries.listTransactionDescriptions'],
    queryFn: () => financeQueries.transactions.descriptions(),
  });
  return data ?? [];
};
