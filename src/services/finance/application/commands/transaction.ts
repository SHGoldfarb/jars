import { generateId } from 'src/lib/utils';
import { financeDomainCommands } from '../../domain';
import type { Transaction } from '../../model';
import type { CurrencyAmount } from 'src/services/shared';
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
    const transaction = financeDomainCommands.transactions.create({
      id: generateId(),
      ...input,
    });
    return deps.transactions.save(transaction);
  },

  update: async (transaction: Transaction) => {
    const parsedTransaction = financeDomainCommands.transactions.update(transaction);
    return deps.transactions.save(parsedTransaction);
  },

  archive: async ({ transactionId }: { transactionId: string }) => {
    const current = await deps.transactions.getById(transactionId);
    return deps.transactions.save(financeDomainCommands.transactions.archive(current));
  },
});
