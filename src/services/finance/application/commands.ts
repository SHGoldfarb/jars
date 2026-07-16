import { generateId } from 'src/lib/utils';
import {
  archiveAccount,
  archiveCategory,
  archiveJar,
  archiveTransaction,
  createAccount,
  createExpenseCategory,
  createIncomeCategory,
  createJar,
  createTransaction,
  renameAccount,
  renameCategory,
  renameJar,
  restoreJar,
  restoreAccount,
  updateTransaction,
} from '../model';
import type { CurrencyAmount, Transaction } from '../model';
import { repositories } from '../infrastructure/repositories';
import type { FinanceRepositories } from '../domain';

export const createFinanceCommands = (deps: FinanceRepositories) => ({
  createAccount: async ({ name }: { name: string }) => {
    const account = createAccount({ id: generateId(), name });
    return deps.accounts.save(account);
  },

  renameAccount: async ({ accountId, name }: { accountId: string; name: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(renameAccount(current, { name }));
  },

  archiveAccount: async ({ accountId }: { accountId: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(archiveAccount(current));
  },

  restoreAccount: async ({ accountId }: { accountId: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(restoreAccount(current));
  },

  createJar: async ({ name }: { name: string }) => {
    const jar = createJar({ id: generateId(), name });
    return deps.jars.save(jar);
  },

  renameJar: async ({ jarId, name }: { jarId: string; name: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(renameJar(current, { name }));
  },

  archiveJar: async ({ jarId }: { jarId: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(archiveJar(current));
  },

  restoreJar: async ({ jarId }: { jarId: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(restoreJar(current));
  },

  createIncomeCategory: async ({ name }: { name: string }) => {
    const category = createIncomeCategory({ id: generateId(), name });
    return deps.categories.save(category);
  },

  createExpenseCategory: async ({ name }: { name: string }) => {
    const category = createExpenseCategory({ id: generateId(), name });
    return deps.categories.save(category);
  },

  renameCategory: async ({ categoryId, name }: { categoryId: string; name: string }) => {
    const current = await deps.categories.getById(categoryId);
    return deps.categories.save(renameCategory(current, { name }));
  },

  archiveCategory: async ({ categoryId }: { categoryId: string }) => {
    const current = await deps.categories.getById(categoryId);
    return deps.categories.save(archiveCategory(current));
  },

  createTransaction: async ({
    kind,
    accountId,
    categoryId,
    jarId,
    amount,
    dateISO,
    description,
  }: {
    kind: 'income' | 'expense';
    accountId: string;
    categoryId: string;
    jarId: string;
    amount: CurrencyAmount;
    dateISO: string;
    description: string;
  }) => {
    const transaction = createTransaction({
      id: generateId(),
      kind,
      accountId,
      categoryId,
      jarId,
      amount,
      dateISO,
      description,
    });

    return deps.transactions.save(transaction);
  },

  updateTransaction: async (transaction: Transaction) => {
    const parsedTransaction = updateTransaction(transaction);
    return deps.transactions.save(parsedTransaction);
  },

  archiveTransaction: async ({ transactionId }: { transactionId: string }) => {
    const current = await deps.transactions.getById(transactionId);
    return deps.transactions.save(archiveTransaction(current));
  },
});

export const financeCommands = createFinanceCommands(repositories);
