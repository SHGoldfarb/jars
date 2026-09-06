import { useParams } from '@tanstack/react-router';
import { useAllocation } from './useAllocation';

export const useAllocationEditCurrentAllocation = () => {
  const { allocationId } = useParams({ strict: false });
  const allocation = useAllocation(allocationId ?? '');

  if (allocationId) {
    return allocation;
  }

  return undefined;
};
