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
    restoreAccount: async (accountId: string) => {
      await financeCommands.accounts.restore({ accountId });
    },
    updateTransaction: async (transaction: Parameters<FinanceCommands['transactions']['update']>[0]) => {
      await financeCommands.transactions.update(transaction);
    },
    getJarBalance: (jarId: string) => financeQueries.getJarBalance(jarId),
    getAccountBalance: (accountId: string) => financeQueries.getAccountBalance(accountId),
    getJar: (jarId: string) => financeQueries.getJarById(jarId),
    getAccount: (accountId: string) => financeQueries.getAccountById(accountId),
    createTransaction: (transaction: Parameters<FinanceCommands['transactions']['create']>[0]) =>
      financeCommands.transactions.create(transaction),
    archiveTransaction: (transactionId: string) =>
      financeCommands.transactions.archive({ transactionId }),
  };
};

export type Dependencies = ReturnType<typeof transformFinanceApiToDeps>;
