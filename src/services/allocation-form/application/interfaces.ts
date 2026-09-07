import { balances } from 'src/services/balances';
import type { financeCommands, financeQueries } from 'src/services/finance';

type FinanceCommands = typeof financeCommands;
type FinanceQueries = typeof financeQueries;

export const transformFinanceApiToDeps = (
  financeCommands: FinanceCommands,
  financeQueries: FinanceQueries
) => {
  return {
    restoreJar: async (jarId: string) => {
      await financeCommands.jars.restore({ jarId });
    },
    updateAllocation: async (
      allocation: Parameters<FinanceCommands['allocations']['update']>[0]
    ) => {
      await financeCommands.allocations.update(allocation);
    },
    getJarBalance: (jarId: string) => balances.queries.jars(jarId),
    getJar: (jarId: string) => financeQueries.jars.getById(jarId),
  };
};

export type Dependencies = ReturnType<typeof transformFinanceApiToDeps>;
