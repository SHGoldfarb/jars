import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useAllocation = (allocationId: string) =>
  useQuery({
    queryKey: ['financeQueries.getAllocationById', allocationId],
    queryFn: () => financeQueries.allocations.getById(allocationId),
  }).data;
