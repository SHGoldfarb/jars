import { Account, Allocation, Category, Jar, Movement, Transaction, Transfer } from '../model';
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

const compareByOrderBy = (a: Movement, b: Movement, orderBy: MovementOrderItem[]) => {
  for (const orderItem of orderBy) {
    const result = orderMovements(a, b, orderItem);
    if (result !== 0) {
      return result;
    }
  }

  return 0;
};

interface MovementListParams {
  includeArchived?: boolean;
  orderBy?: MovementOrderItem[];
}

// Every movement kind is listed the same way: drop the archived ones unless asked for, then
// order by the shared Movement fields. The kind only decides the element type.
const listMovementsOfType = <T extends Movement>(items: T[], params: MovementListParams): T[] => {
  const { includeArchived = false, orderBy = [{ dateISO: 'desc' }] } = params;
  return items
    .filter((item) => includeArchived || !item.archivedAtISO)
    .sort((a, b) => compareByOrderBy(a, b, orderBy));
};

const listTransactions = (transactions: Transaction[], params: MovementListParams) =>
  listMovementsOfType(transactions, params);

const listTransfers = (transfers: Transfer[], params: MovementListParams) =>
  listMovementsOfType(transfers, params);

const listAllocations = (allocations: Allocation[], params: MovementListParams) =>
  listMovementsOfType(allocations, params);

export type MovementListEntry =
  | ({ movementType: 'transaction' } & Transaction)
  | ({ movementType: 'transfer' } & Transfer)
  | ({ movementType: 'allocation' } & Allocation);

const listMovements = (
  {
    transactions,
    transfers,
    allocations,
  }: { transactions: Transaction[]; transfers: Transfer[]; allocations: Allocation[] },
  params: MovementListParams
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
    ...listAllocations(allocations, params).map((allocation) => ({
      movementType: 'allocation' as const,
      ...allocation,
    })),
  ];

  return entries.sort((a, b) => compareByOrderBy(a, b, orderBy));
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
  allocations: {
    list: listAllocations,
  },
  movements: {
    list: listMovements,
  },
};
