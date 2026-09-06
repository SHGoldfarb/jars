import { generateId } from 'src/lib/utils';
import { financeDomainCommands } from '../../domain';
import type { Allocation } from '../../model';
import type { CurrencyAmount } from 'src/services/shared';
import type { FinanceRepositories } from '../../domain';

interface CreateAllocationInput {
  originJarId: string;
  destinationJarId: string;
  amount: CurrencyAmount;
  dateISO: string;
  description: string;
}

export const createAllocationCommands = (deps: FinanceRepositories) => ({
  create: async (input: CreateAllocationInput) => {
    const allocation = financeDomainCommands.allocations.create({
      id: generateId(),
      ...input,
    });
    return deps.allocations.save(allocation);
  },

  update: async (allocation: Allocation) => {
    const parsedAllocation = financeDomainCommands.allocations.update(allocation);
    return deps.allocations.save(parsedAllocation);
  },

  archive: async ({ allocationId }: { allocationId: string }) => {
    const current = await deps.allocations.getById(allocationId);
    return deps.allocations.save(financeDomainCommands.allocations.archive(current));
  },
});
