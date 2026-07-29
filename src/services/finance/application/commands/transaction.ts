import { generateId } from 'src/lib/utils';
import { archiveTransaction, createTransaction, updateTransaction } from '../../model';
import type { CurrencyAmount, Transaction } from '../../model';
import type { FinanceRepositories } from '../../domain';

interface CreateTransactionInput {
  kind: 'income' | 'expense';
  accountId: string;
  categoryId: string;
  jarId: string;
  amount: CurrencyAmount;
  dateISO: string;
  description: string;
}

export const createTransactionCommands = (deps: FinanceRepositories) => ({
  create: async (input: CreateTransactionInput) => {
    const transaction = createTransaction({
      id: generateId(),
      ...input
    });
    return deps.transactions.save(transaction);
  },

  update: async (transaction: Transaction) => {
    const parsedTransaction = updateTransaction(transaction);
    return deps.transactions.save(parsedTransaction);
  },

  archive: async ({ transactionId }: { transactionId: string }) => {
    const current = await deps.transactions.getById(transactionId);
    return deps.transactions.save(archiveTransaction(current));
  },
});
