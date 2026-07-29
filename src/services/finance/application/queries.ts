import { repositories } from '../infrastructure/repositories';
import { financeDomainQueries, type FinanceRepositories } from '../domain';

export const createFinanceQueries = (deps: FinanceRepositories) => ({
  accounts: {
    list: async (params?: { includeArchived?: boolean }) =>
      financeDomainQueries.accounts.list(await deps.accounts.list(), params ?? {}),
    getById: (accountId: string) => deps.accounts.getById(accountId),
    balance: async (accountId: string) =>
      financeDomainQueries.accounts.balance(accountId, await deps.transactions.list()),
    lastOperationId: () => deps.accounts.getLastOperationId(),
  },
  jars: {
    list: async (params?: { includeArchived?: boolean }) =>
      financeDomainQueries.jars.list(await deps.jars.list(), params ?? {}),
    getById: (jarId: string) => deps.jars.getById(jarId),
    balance: async (jarId: string) =>
      financeDomainQueries.jars.balance(jarId, await deps.transactions.list()),
    lastOperationId: () => deps.jars.getLastOperationId(),
  },
  categories: {
    listIncome: async (params?: { includeArchived?: boolean }) =>
      financeDomainQueries.categories.list(await deps.categories.listIncome(), params ?? {}),
    listExpense: async (params?: { includeArchived?: boolean }) =>
      financeDomainQueries.categories.list(await deps.categories.listExpense(), params ?? {}),
    getById: (categoryId: string) => deps.categories.getById(categoryId),
    lastOperationId: () => deps.categories.getLastOperationId(),
  },
  transactions: {
    list: async (params?: {
      includeArchived?: boolean;
      orderBy?: { dateISO?: 'asc' | 'desc' }[];
    }) => financeDomainQueries.transactions.list(await deps.transactions.list(), params ?? {}),
    getById: (transactionId: string) => deps.transactions.getById(transactionId),
    lastOperationId: () => deps.transactions.getLastOperationId(),
  },
});

export const financeQueries = createFinanceQueries(repositories);
