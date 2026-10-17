import { randomUUID } from 'node:crypto';
import type { FinanceSnapshot } from 'src/services/finance';

// A valid datetime-local value for movements whose date the caller doesn't care about. Movements
// lists one month at a time and opens on the current one, so it is dated inside that month -
// a hardcoded month would only be on screen during that month of the year. Day and time are
// fixed, so the value is stable for the whole run.
const now = new Date();
export const DEFAULT_MOVEMENT_DATE = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10, 9, 0)
)
  .toISOString()
  .slice(0, 16);

// An entity is named by a plain string, or by an object when it has to start out archived - the
// state deleting it from its form leaves it in.
export type SeedNamed = string | { name: string; archived: true };

export interface SeedSubcategory {
  categoryName: string;
  name: string;
}

interface SeedMovement {
  // A plain decimal, written the way the forms are typed into in English: `1234.56`.
  amount?: string;
  // A datetime-local value, as the forms' date field takes it.
  date?: string;
  description: string;
  archived?: boolean;
}

// Account, jar and category default to the first default-data entry of the matching kind, so a
// test that only cares about one field says only that.
export interface SeedTransaction extends SeedMovement {
  type?: 'Income' | 'Expense';
  accountName?: string;
  jarName?: string;
  categoryName?: string;
  subcategoryName?: string;
}

// A transaction bookmark: what a transaction carries, minus the date a bookmark never has.
export type SeedBookmark = Omit<SeedTransaction, 'date' | 'archived'>;

export interface SeedTransfer extends SeedMovement {
  originAccountName: string;
  destinationAccountName: string;
}

export interface SeedAllocation extends SeedMovement {
  originJarName: string;
  destinationJarName: string;
}

// The data a test starts from, written by name. It reaches the app through "Load from backup",
// which is far quicker than walking every create form.
export interface SeedData {
  accounts?: readonly SeedNamed[];
  jars?: readonly SeedNamed[];
  incomeCategories?: readonly SeedNamed[];
  expenseCategories?: readonly SeedNamed[];
  subcategories?: readonly SeedSubcategory[];
  transactions?: readonly SeedTransaction[];
  transfers?: readonly SeedTransfer[];
  allocations?: readonly SeedAllocation[];
  bookmarks?: readonly SeedBookmark[];
}

export const defaultData = {
  incomeCategories: ['Salary'],
  expenseCategories: ['Groceries'],
  accounts: ['Wallet'],
  jars: ['Monthly expenses'],
} as const satisfies SeedData;

// Fixed rather than "now", so an archived entity looks the same on every run.
const ARCHIVED_AT_ISO = '2026-01-01T00:00:00.000Z';

const nameOf = (entry: SeedNamed) => (typeof entry === 'string' ? entry : entry.name);
const archivedOf = (archived: boolean | undefined) =>
  archived ? { archivedAtISO: ARCHIVED_AT_ISO } : {};

const named = (entry: SeedNamed) => ({
  id: randomUUID(),
  name: nameOf(entry),
  ...archivedOf(typeof entry !== 'string'),
});

// A name that matches nothing, or more than one thing, is a mistake in the test rather than
// something to guess around.
const idByName = (entities: { id: string; name: string }[], kind: string, name: string) => {
  const matches = entities.filter((entity) => entity.name === name);
  if (matches.length !== 1) {
    throw new Error(`Seed data names ${kind} "${name}" ${matches.length.toString()} times`);
  }
  return matches[0].id;
};

const toAmount = (amount: string) => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount);
  if (!match) {
    throw new Error(`Seed amount "${amount}" is not a plain decimal`);
  }
  const [, whole, fraction = ''] = match;
  return {
    currency: 'CLP' as const,
    amountDecimal: { value: `${whole}${fraction}`, decimalPlaces: fraction.length },
  };
};

// The forms read a datetime-local value as UTC.
const toDateISO = (date: string) => new Date(`${date}:00.000Z`).toISOString();

const movement = ({
  amount = '1000',
  date = DEFAULT_MOVEMENT_DATE,
  description,
  archived,
}: SeedMovement) => ({
  id: randomUUID(),
  amount: toAmount(amount),
  dateISO: toDateISO(date),
  description,
  ...archivedOf(archived),
});

const toSnapshot = (data: SeedData): FinanceSnapshot => {
  const accounts = (data.accounts ?? []).map(named);
  const jars = (data.jars ?? []).map(named);
  const categories = [
    ...(data.incomeCategories ?? []).map((entry) => ({ ...named(entry), kind: 'income' as const })),
    ...(data.expenseCategories ?? []).map((entry) => ({
      ...named(entry),
      kind: 'expense' as const,
    })),
  ];
  const subcategories = (data.subcategories ?? []).map(({ categoryName, name }) => ({
    id: randomUUID(),
    name,
    categoryId: idByName(categories, 'category', categoryName),
  }));

  // What a transaction and a transaction bookmark share: everything a transaction points at.
  const transactionFields = (transaction: SeedBookmark) => {
    const type = transaction.type ?? 'Expense';
    const defaultCategoryName =
      type === 'Income' ? defaultData.incomeCategories[0] : defaultData.expenseCategories[0];
    const categoryId = idByName(
      categories,
      'category',
      transaction.categoryName ?? defaultCategoryName
    );
    const subcategoryId =
      transaction.subcategoryName === undefined
        ? {}
        : {
            subcategoryId: idByName(
              subcategories.filter((subcategory) => subcategory.categoryId === categoryId),
              'subcategory',
              transaction.subcategoryName
            ),
          };

    return {
      amount: toAmount(transaction.amount ?? '1000'),
      description: transaction.description,
      kind: type === 'Income' ? ('income' as const) : ('expense' as const),
      accountId: idByName(accounts, 'account', transaction.accountName ?? defaultData.accounts[0]),
      jarId: idByName(jars, 'jar', transaction.jarName ?? defaultData.jars[0]),
      categoryId,
      ...subcategoryId,
    };
  };

  const transactions = (data.transactions ?? []).map((transaction) => ({
    ...movement(transaction),
    ...transactionFields(transaction),
  }));

  const transfers = (data.transfers ?? []).map((transfer) => ({
    ...movement(transfer),
    originAccountId: idByName(accounts, 'account', transfer.originAccountName),
    destinationAccountId: idByName(accounts, 'account', transfer.destinationAccountName),
  }));

  const allocations = (data.allocations ?? []).map((allocation) => ({
    ...movement(allocation),
    originJarId: idByName(jars, 'jar', allocation.originJarName),
    destinationJarId: idByName(jars, 'jar', allocation.destinationJarName),
  }));

  // Created a minute apart in the order given, so the menu - newest first - lists them reversed.
  const bookmarks = (data.bookmarks ?? []).map((bookmark, index) => {
    return {
      ...transactionFields(bookmark),
      id: randomUUID(),
      createdAtISO: new Date(Date.parse(ARCHIVED_AT_ISO) + index * 60_000).toISOString(),
      movementType: 'transaction' as const,
    };
  });

  return {
    accounts,
    jars,
    categories,
    subcategories,
    transactions,
    transfers,
    allocations,
    bookmarks,
  };
};

// The backup file "Load from backup" takes. The schema version is hardcoded like the settings
// tests' own backups, so a version bump fails loudly here instead of being followed silently.
export const seedBackupFile = (data: SeedData) => ({
  name: 'jars-seed.json',
  mimeType: 'application/json',
  buffer: Buffer.from(
    JSON.stringify({
      schemaVersion: 5,
      createdAtISO: '2026-01-01T00:00:00.000Z',
      data: toSnapshot(data),
    })
  ),
});
