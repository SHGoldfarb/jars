import { repositories } from '../infrastructure/repositories';
import { financeDomainQueries, type FinanceRepositories } from '../domain';
import type { YearMonthKey } from 'src/lib/yearMonth';
import { makeVersionedMemoize } from 'src/lib/utils';

const listMovementsByKind = async (deps: FinanceRepositories) => ({
  transactions: await deps.transactions.list(),
  transfers: await deps.transfers.list(),
  allocations: await deps.allocations.list(),
});

export const createFinanceQueries = (deps: FinanceRepositories) => {
  const movementsStateId = () =>
    [
      deps.allocations.getLastOperationId(),
      deps.transactions.getLastOperationId(),
      deps.transfers.getLastOperationId(),
    ].join(':');

  const databaseStateId = () =>
    [
      movementsStateId(),
      deps.accounts.getLastOperationId(),
      deps.jars.getLastOperationId(),
      deps.categories.getLastOperationId(),
    ].join(':');

  const withDatabaseCache = <T extends unknown[], U>(f: (...args: T) => U) => {
    const versionedMemo = makeVersionedMemoize();
    const memoized = versionedMemo.memoize(f);

    return (...args: T) => {
      versionedMemo.version.set(databaseStateId());
      return memoized(...args);
    };
  };

  return {
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
    allocations: {
      list: async (params?: {
        includeArchived?: boolean;
        orderBy?: { dateISO?: 'asc' | 'desc' }[];
      }) => financeDomainQueries.allocations.list(await deps.allocations.list(), params ?? {}),
      getById: (allocationId: string) => deps.allocations.getById(allocationId),
      lastOperationId: () => deps.allocations.getLastOperationId(),
    },
    database: {
      snapshot: () => deps.database.snapshot(),
      stateId: databaseStateId,
    },
    movements: {
      list: async (params?: {
        includeArchived?: boolean;
        orderBy?: { dateISO?: 'asc' | 'desc' }[];
        month?: YearMonthKey;
      }) => financeDomainQueries.movements.list(await listMovementsByKind(deps), params ?? {}),
      months: withDatabaseCache(async (params?: { includeArchived?: boolean }) => {
        return financeDomainQueries.movements.months(await listMovementsByKind(deps), params ?? {});
      }),
      stateId: movementsStateId,
    },
  };
};

export const financeQueries = createFinanceQueries(repositories);
