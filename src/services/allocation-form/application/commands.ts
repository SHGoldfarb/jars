import { Allocation, financeCommands, financeQueries } from 'src/services/finance';
import { AllocationFormDomainCommands } from '../domain/commands';
import { transformFinanceApiToDeps, type Dependencies } from './interfaces';

const createAllocationFormCommands = (deps: Dependencies) => {
  return {
    submitEditAllocation: async (params: Allocation) => {
      await AllocationFormDomainCommands.submitEditAllocation(params, deps);
    },
  };
};

export const allocationFormCommands = createAllocationFormCommands(
  transformFinanceApiToDeps(financeCommands, financeQueries)
);
