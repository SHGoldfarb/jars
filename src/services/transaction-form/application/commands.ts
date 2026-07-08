import {
  financeCommands,
  financeQueries,
  Transaction,
  TransactionUnsaved,
} from 'src/services/finance';
import { TransactionFormDomainCommands } from '../domain/commands';

const createTransactionFormCommands = (
  financeQueriesDeps: typeof financeQueries,
  financeCommandsDeps: typeof financeCommands
) => {
  const deps = {
    restoreJar: async (jarId: string) => {
      await financeCommandsDeps.restoreJar({ jarId });
    },
    restoreAccount: async (accountId: string) => {
      await financeCommandsDeps.restoreAccount({ accountId });
    },
    updateTransaction: async (transaction: Transaction) => {
      await financeCommandsDeps.updateTransaction(transaction);
    },
    getJarBalance: (jarId: string) => financeQueriesDeps.getJarBalance(jarId),
    getAccountBalance: (accountId: string) => financeQueriesDeps.getAccountBalance(accountId),
    getJar: (jarId: string) => financeQueriesDeps.getJarById(jarId),
    getAccount: (accountId: string) => financeQueriesDeps.getAccountById(accountId),
  };

  return {
    submitEditTransaction: async (params: Transaction) => {
      await TransactionFormDomainCommands.submitEditTransaction(params, deps);
    },
    submitCreateTransaction: (params: TransactionUnsaved) =>
      financeCommandsDeps.createTransaction(params),
    deleteTransaction: (params: { transactionId: string }) =>
      financeCommandsDeps.archiveTransaction(params),
  };
};

export const transactionFormCommands = createTransactionFormCommands(
  financeQueries,
  financeCommands
);
