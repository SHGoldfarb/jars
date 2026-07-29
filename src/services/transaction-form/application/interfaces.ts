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
    restoreAccount: async (accountId: string) => {
      await financeCommands.accounts.restore({ accountId });
    },
    updateTransaction: async (
      transaction: Parameters<FinanceCommands['transactions']['update']>[0]
    ) => {
      await financeCommands.transactions.update(transaction);
    },
    getJarBalance: (jarId: string) => balances.queries.jars(jarId),
    getAccountBalance: (accountId: string) => balances.queries.accounts(accountId),
    getJar: (jarId: string) => financeQueries.jars.getById(jarId),
    getAccount: (accountId: string) => financeQueries.accounts.getById(accountId),
    createTransaction: (transaction: Parameters<FinanceCommands['transactions']['create']>[0]) =>
      financeCommands.transactions.create(transaction),
    archiveTransaction: (transactionId: string) =>
      financeCommands.transactions.archive({ transactionId }),
  };
};

export type Dependencies = ReturnType<typeof transformFinanceApiToDeps>;
