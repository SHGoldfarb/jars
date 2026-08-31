import { Account, Category, Jar, Movement, Transaction, Transfer } from '../model';
import type { MovementOrderItem } from './repositories';

const listJars = (jars: Jar[], params: { includeArchived?: boolean }) => {
  const { includeArchived = false } = params;
  return jars.filter((jar) => includeArchived || !jar.archivedAtISO);
};

const listCategories = (categories: Category[], params: { includeArchived?: boolean }) => {
  const { includeArchived = false } = params;
  return categories.filter((category) => includeArchived || !category.archivedAtISO);
};

const listAccounts = (accounts: Account[], params: { includeArchived?: boolean }) => {
  const { includeArchived = false } = params;
  return accounts.filter((account) => includeArchived || !account.archivedAtISO);
};

const orderMovements = (a: Movement, b: Movement, orderItem: MovementOrderItem) => {
  let result: number | undefined = undefined;
  if (orderItem.dateISO === 'asc') {
    result = a.dateISO.localeCompare(b.dateISO);
  }
  if (orderItem.dateISO === 'desc') {
    result = b.dateISO.localeCompare(a.dateISO);
  }

  return result ?? 0;
};

const listTransactions = (
  transactions: Transaction[],
  params: { includeArchived?: boolean; orderBy?: MovementOrderItem[] }
) => {
  const { includeArchived = false, orderBy = [{ dateISO: 'desc' }] } = params;
  return transactions
    .filter((transaction) => includeArchived || !transaction.archivedAtISO)
    .sort((a, b) => {
      for (const orderItem of orderBy) {
        const result = orderMovements(a, b, orderItem);
        if (result !== 0) {
          return result;
        }
      }

      return 0;
    });
};

const listTransfers = (
  transfers: Transfer[],
  params: { includeArchived?: boolean; orderBy?: MovementOrderItem[] }
) => {
  const { includeArchived = false, orderBy = [{ dateISO: 'desc' }] } = params;
  return transfers
    .filter((transfer) => includeArchived || !transfer.archivedAtISO)
    .sort((a, b) => {
      for (const orderItem of orderBy) {
        const result = orderMovements(a, b, orderItem);
        if (result !== 0) {
          return result;
        }
      }

      return 0;
    });
};

export type MovementListEntry =
  | ({ movementType: 'transaction' } & Transaction)
  | ({ movementType: 'transfer' } & Transfer);

const listMovements = (
  transactions: Transaction[],
  transfers: Transfer[],
  params: { includeArchived?: boolean; orderBy?: MovementOrderItem[] }
): MovementListEntry[] => {
  const { orderBy = [{ dateISO: 'desc' }] } = params;

  const entries: MovementListEntry[] = [
    ...listTransactions(transactions, params).map((transaction) => ({
      movementType: 'transaction' as const,
      ...transaction,
    })),
    ...listTransfers(transfers, params).map((transfer) => ({
      movementType: 'transfer' as const,
      ...transfer,
    })),
  ];

  return entries.sort((a, b) => {
    for (const orderItem of orderBy) {
      const result = orderMovements(a, b, orderItem);
      if (result !== 0) {
        return result;
      }
    }

    return 0;
  });
};

export const financeDomainQueries = {
  transactions: {
    list: listTransactions,
  },
  accounts: {
    list: listAccounts,
  },
  categories: {
    list: listCategories,
  },
  jars: {
    list: listJars,
  },
  transfers: {
    list: listTransfers,
  },
  movements: {
    list: listMovements,
  },
};
