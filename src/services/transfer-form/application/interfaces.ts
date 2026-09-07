import { balances } from 'src/services/balances';
import type { financeCommands, financeQueries } from 'src/services/finance';

type FinanceCommands = typeof financeCommands;
type FinanceQueries = typeof financeQueries;

export const transformFinanceApiToDeps = (
  financeCommands: FinanceCommands,
  financeQueries: FinanceQueries
) => {
  return {
    restoreAccount: async (accountId: string) => {
      await financeCommands.accounts.restore({ accountId });
    },
    updateTransfer: async (transfer: Parameters<FinanceCommands['transfers']['update']>[0]) => {
      await financeCommands.transfers.update(transfer);
    },
    getAccountBalance: (accountId: string) => balances.queries.accounts(accountId),
    getAccount: (accountId: string) => financeQueries.accounts.getById(accountId),
  };
};

export type Dependencies = ReturnType<typeof transformFinanceApiToDeps>;
