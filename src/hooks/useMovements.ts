import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useMovements = () => {
  const { data } = useQuery({
    queryKey: ['financeQueries.listMovements'],
    queryFn: () => financeQueries.movements.list(),
  });

  return { movements: data ?? [] };
};
