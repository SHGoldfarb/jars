import { Dexie, type Table } from 'dexie';
import { makeVersionedMemoize } from 'src/lib/utils';
import type { FinanceSnapshot } from '../model';
import z from 'zod';

// The version the database is currently on. A backup carries it so a restore can tell
// whether it understands the file.
export const DB_SCHEMA_VERSION = 5;

const db = new Dexie('JarsMainDatabase');

db.version(2).stores({
  accounts: '&id',
  jars: '&id',
  categories: '&id',
  transactions: '&id, accountId, jarId',
  allocations: '&id, originJarId, destinationJarId',
  transfers: '&id, originAccountId, destinationAccountId',
});

db.version(3).upgrade((tx) => {
  return tx
    .table('transactions')
    .toCollection()
    .modify((transaction) => {
      const transactionValidator = z.object({
        amount: z.object({
          amountDecimal: z.object({
            value: z.bigint().or(z.string()),
          }),
        }),
      });

      const typed = (value: unknown): value is z.infer<typeof transactionValidator> =>
        transactionValidator.safeParse(value).success;

      if (typed(transaction)) {
        const amount = transaction.amount.amountDecimal.value;
        if (typeof amount === 'bigint') {
          transaction.amount.amountDecimal.value = amount.toString();
        }
      }
    });
});

// Only the added store is declared: Dexie carries every unchanged one forward, and an existing
// database needs no data migration because a subcategory is something new rather than a
// reshaping of what is already stored.
db.version(4).stores({
  subcategories: '&id, categoryId',
});

// Bookmarks are a new store too, so the same holds: declare it and nothing else.
db.version(DB_SCHEMA_VERSION).stores({
  bookmarks: '&id',
});

interface Identified {
  id: string;
}

const memoizedTable = <T extends Identified, U, V>(table: Table<T, U, V>) => {
  const versionedMemoize = makeVersionedMemoize({ maxSize: 3 });

  const getMap = versionedMemoize.memoize(async () => {
    const items = await table.toArray();
    const map: Record<string, T> = {};
    for (const item of items) {
      map[item.id] = item;
    }
    return map;
  });

  const upsert = async (item: V) => {
    const result = await table.put(item);
    versionedMemoize.version.invalidate();
    return result;
  };

  // `upVersion` is exposed so a whole-database write can invalidate a table it wrote
  // through some path other than `upsert`.
  return {
    getMap,
    upsert,
    upVersion: versionedMemoize.version.invalidate,
    getStateVersion: versionedMemoize.version.current,
  };
};

const TABLE_NAMES = [
  'accounts',
  'jars',
  'categories',
  'subcategories',
  'transactions',
  'allocations',
  'transfers',
  'bookmarks',
] as const;

export type FinanceTableName = (typeof TABLE_NAMES)[number];

const tables = {
  accounts: memoizedTable(db.table('accounts')),
  jars: memoizedTable(db.table('jars')),
  categories: memoizedTable(db.table('categories')),
  subcategories: memoizedTable(db.table('subcategories')),
  transactions: memoizedTable(db.table('transactions')),
  allocations: memoizedTable(db.table('allocations')),
  transfers: memoizedTable(db.table('transfers')),
  bookmarks: memoizedTable(db.table('bookmarks')),
};

// Rows leave persistence unvalidated: the repository parses them into `FinanceSnapshot`.
const snapshot = async (): Promise<Record<FinanceTableName, unknown[]>> => {
  const [
    accounts,
    jars,
    categories,
    subcategories,
    transactions,
    allocations,
    transfers,
    bookmarks,
  ] = await Promise.all([
    tables.accounts.getMap(),
    tables.jars.getMap(),
    tables.categories.getMap(),
    tables.subcategories.getMap(),
    tables.transactions.getMap(),
    tables.allocations.getMap(),
    tables.transfers.getMap(),
    tables.bookmarks.getMap(),
  ]);

  return {
    accounts: Object.values(accounts),
    jars: Object.values(jars),
    categories: Object.values(categories),
    subcategories: Object.values(subcategories),
    transactions: Object.values(transactions),
    allocations: Object.values(allocations),
    transfers: Object.values(transfers),
    bookmarks: Object.values(bookmarks),
  };
};

// A whole-database write goes around `upsert`, so the memoized maps have to be dropped by hand.
// Bumping after the commit is the safe order: an over-eager bump costs a recompute, a missed one
// serves stale data forever.
const upAllVersions = () => {
  TABLE_NAMES.forEach((name) => {
    tables[name].upVersion();
  });
};

// The raw Dexie tables, used only by the whole-database writes: everything else goes through
// the memoized wrappers above.
const dexieTable = (name: FinanceTableName) => db.table<Identified>(name);

const dexieTables = TABLE_NAMES.map(dexieTable);

const clearEveryTable = () => Promise.all(dexieTables.map((table) => table.clear()));

// Dexie rolls the whole transaction back on any failure, so the database is never left
// half-written.
const writeAllTables = (write: () => Promise<unknown>) => db.transaction('rw', dexieTables, write);

const replaceAll = async (snapshotToWrite: FinanceSnapshot) => {
  await writeAllTables(async () => {
    await clearEveryTable();
    await Promise.all(TABLE_NAMES.map((name) => dexieTable(name).bulkPut(snapshotToWrite[name])));
  });
  upAllVersions();
};

const clear = async () => {
  await writeAllTables(clearEveryTable);
  upAllVersions();
};

export const DB = { ...tables, snapshot, replaceAll, clear };
