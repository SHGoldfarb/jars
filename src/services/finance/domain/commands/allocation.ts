import * as z from 'zod';
import { Allocation } from '../../model';

export const AllocationUnsaved = z.object({
  ...Allocation.shape,
  id: Allocation.shape.id.optional(),
});

export type AllocationUnsaved = z.infer<typeof AllocationUnsaved>;

const NewAllocationInput = z.object({
  id: Allocation.shape.id,
  originJarId: Allocation.shape.originJarId,
  destinationJarId: Allocation.shape.destinationJarId,
  amount: Allocation.shape.amount,
  dateISO: Allocation.shape.dateISO,
  description: Allocation.shape.description,
});

type NewAllocationInput = z.infer<typeof NewAllocationInput>;

const ensureDistinctJars = (allocation: Pick<Allocation, 'originJarId' | 'destinationJarId'>) => {
  if (allocation.originJarId === allocation.destinationJarId) {
    throw new Error('Origin and destination jars must be different');
  }
};

export const allocations = {
  create: (input: NewAllocationInput) => {
    const allocation = Allocation.parse(input);
    ensureDistinctJars(allocation);
    return allocation;
  },
  update: (input: Allocation) => {
    const allocation = Allocation.parse(input);
    ensureDistinctJars(allocation);
    return allocation;
  },
  archive: (allocation: Allocation, archivedAtISO = new Date().toISOString()) =>
    Allocation.parse({ ...allocation, archivedAtISO }),
};
