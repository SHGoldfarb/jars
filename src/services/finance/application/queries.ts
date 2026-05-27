import { repositories } from '../infrastructure/repositories';
import type { FinanceRepositories } from '../domain';

export const createFinanceQueries = (deps: FinanceRepositories) => ({
  listAccounts: (params?: { includeArchived?: boolean }) => deps.accounts.list(params),
  getAccountById: (accountId: string) => deps.accounts.getById(accountId),

  listJars: (params?: { includeArchived?: boolean }) => deps.jars.list(params),
  getJarById: (jarId: string) => deps.jars.getById(jarId),

  listCategoriesIncome: (params?: { includeArchived?: boolean }) =>
    deps.categories.listIncome(params),
  listCategoriesExpense: (params?: { includeArchived?: boolean }) =>
    deps.categories.listExpense(params),
  getCategoryById: (categoryId: string) => deps.categories.getById(categoryId),

  listTransactions: (params?: { includeArchived?: boolean }) => deps.transactions.list(params),
});

export const financeQueries = createFinanceQueries(repositories);
