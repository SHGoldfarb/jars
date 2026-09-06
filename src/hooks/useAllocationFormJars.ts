import { useQuery } from '@tanstack/react-query';
import { allocationForm } from 'src/services/allocation-form';

export const useAllocationFormJars = (allocationId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['allocationFormQueries.getJarsForSelector', allocationId],
    queryFn: () => allocationForm.queries.getJarsForSelector(allocationId),
  });
  return data ?? [];
};
