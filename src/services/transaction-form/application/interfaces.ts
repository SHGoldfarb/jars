import type { financeCommands, financeQueries } from 'src/services/finance';

type FinanceCommands = typeof financeCommands;
type FinanceQueries = typeof financeQueries;

export const transformFinanceApiToDeps = (
  financeCommands: FinanceCommands,
  financeQueries: FinanceQueries
) => {
  return {
    restoreJar: async (jarId: string) => {
      await financeCommands.restoreJar({ jarId });
    },
    restoreAccount: async (accountId: string) => {
      await financeCommands.restoreAccount({ accountId });
    },
    updateTransaction: async (transaction: Parameters<FinanceCommands['updateTransaction']>[0]) => {
      await financeCommands.updateTransaction(transaction);
    },
    getJarBalance: (jarId: string) => financeQueries.getJarBalance(jarId),
    getAccountBalance: (accountId: string) => financeQueries.getAccountBalance(accountId),
    getJar: (jarId: string) => financeQueries.getJarById(jarId),
    getAccount: (accountId: string) => financeQueries.getAccountById(accountId),
    createTransaction: (transaction: Parameters<FinanceCommands['createTransaction']>[0]) =>
      financeCommands.createTransaction(transaction),
    archiveTransaction: (transactionId: string) =>
      financeCommands.archiveTransaction({ transactionId }),
  };
};

export type Dependencies = ReturnType<typeof transformFinanceApiToDeps>;
