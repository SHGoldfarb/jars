import { repositories } from '../infrastructure/repositories';
import { financeDomainQueries, type FinanceRepositories } from '../domain';

export const createFinanceQueries = (deps: FinanceRepositories) => ({
  accounts: {
    list: async (params?: { includeArchived?: boolean }) =>
      financeDomainQueries.accounts.list(await deps.accounts.list(), params ?? {}),
    getById: (accountId: string) => deps.accounts.getById(accountId),
    lastOperationId: () => deps.accounts.getLastOperationId(),
  },
  jars: {
    list: async (params?: { includeArchived?: boolean }) =>
      financeDomainQueries.jars.list(await deps.jars.list(), params ?? {}),
    getById: (jarId: string) => deps.jars.getById(jarId),
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
  transfers: {
    list: async (params?: {
      includeArchived?: boolean;
      orderBy?: { dateISO?: 'asc' | 'desc' }[];
    }) => financeDomainQueries.transfers.list(await deps.transfers.list(), params ?? {}),
    getById: (transactionId: string) => deps.transfers.getById(transactionId),
    lastOperationId: () => deps.transfers.getLastOperationId(),
  },
  movements: {
    list: async (params?: {
      includeArchived?: boolean;
      orderBy?: { dateISO?: 'asc' | 'desc' }[];
    }) =>
      financeDomainQueries.movements.list(
        await deps.transactions.list(),
        await deps.transfers.list(),
        params ?? {}
      ),
  },
});

export const financeQueries = createFinanceQueries(repositories);
