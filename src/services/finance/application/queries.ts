import { repositories } from '../infrastructure/repositories';
import { financeDomainQueries, type FinanceRepositories } from '../domain';

export const createFinanceQueries = (deps: FinanceRepositories) => ({
  listAccounts: async (params?: { includeArchived?: boolean }) =>
    financeDomainQueries.accounts.list(await deps.accounts.list(), params ?? {}),
  getAccountById: (accountId: string) => deps.accounts.getById(accountId),
  getAccountBalance: async (accountId: string) =>
    financeDomainQueries.accounts.balance(accountId, await deps.transactions.list()),

  listJars: async (params?: { includeArchived?: boolean }) =>
    financeDomainQueries.jars.list(await deps.jars.list(), params ?? {}),
  getJarById: (jarId: string) => deps.jars.getById(jarId),
  getJarBalance: async (jarId: string) =>
    financeDomainQueries.jars.balance(jarId, await deps.transactions.list()),

  listCategoriesIncome: async (params?: { includeArchived?: boolean }) =>
    financeDomainQueries.categories.list(await deps.categories.listIncome(), params ?? {}),
  listCategoriesExpense: async (params?: { includeArchived?: boolean }) =>
    financeDomainQueries.categories.list(await deps.categories.listExpense(), params ?? {}),
  getCategoryById: (categoryId: string) => deps.categories.getById(categoryId),

  listTransactions: async (params?: {
    includeArchived?: boolean;
    orderBy?: { dateISO?: 'asc' | 'desc' }[];
  }) => financeDomainQueries.transactions.list(await deps.transactions.list(), params ?? {}),
  getTransactionById: (transactionId: string) => deps.transactions.getById(transactionId),
});

export const financeQueries = createFinanceQueries(repositories);
