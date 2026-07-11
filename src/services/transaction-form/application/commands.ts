import {
  financeCommands,
  financeQueries,
  Transaction,
  TransactionUnsaved,
} from 'src/services/finance';
import { TransactionFormDomainCommands } from '../domain/commands';
import { transformFinanceApiToDeps, type Dependencies } from './interfaces';

const createTransactionFormCommands = (deps: Dependencies) => {
  return {
    submitEditTransaction: async (params: Transaction) => {
      await TransactionFormDomainCommands.submitEditTransaction(params, deps);
    },
    submitCreateTransaction: (params: TransactionUnsaved) => deps.createTransaction(params),
    deleteTransaction: (params: { transactionId: string }) =>
      deps.archiveTransaction(params.transactionId),
  };
};

export const transactionFormCommands = createTransactionFormCommands(
  transformFinanceApiToDeps(financeCommands, financeQueries)
);
