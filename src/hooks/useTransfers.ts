import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useTransfers = () => {
  const { data } = useQuery({
    queryKey: ['financeQueries.listTransfers'],
    queryFn: () => financeQueries.transfers.list(),
  });

  return { transfers: data ?? [] };
};
