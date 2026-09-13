import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';
import type { YearMonthKey } from 'src/lib/yearMonth';

export const useMovements = (month: YearMonthKey) => {
  const { data, isPending } = useQuery({
    queryKey: ['financeQueries.listMovements', month],
    queryFn: () => financeQueries.movements.list({ month }),
  });

  // isPending separates "this month holds nothing" from "the list has not arrived yet", so an
  // empty month can say so without the message flashing on every month change.
  return { movements: data ?? [], isPending };
};
