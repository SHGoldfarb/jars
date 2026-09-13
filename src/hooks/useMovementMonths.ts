import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useMovementMonths = () => {
  const { data } = useQuery({
    queryKey: ['financeQueries.listMovementMonths'],
    queryFn: () => financeQueries.movements.months(),
  });

  return { months: data ?? [] };
};
