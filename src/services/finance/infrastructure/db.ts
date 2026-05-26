import { Dexie, type Table } from 'dexie';
import { makeVersionedMemoize } from 'src/lib/utils';

const db = new Dexie('JarsMainDatabase');

db.version(2).stores({
  accounts: '&id',
  jars: '&id',
  categories: '&id',
  transactions: '&id, accountId, jarId',
  allocations: '&id, originJarId, destinationJarId',
  transfers: '&id, originAccountId, destinationAccountId',
});

const memoizedTable = <T extends { id: string }, U, V>(table: Table<T, U, V>) => {
  const { versionedMemoize, versionInvalidator } = makeVersionedMemoize();

  const getMap = versionedMemoize(async () => {
    const items = await table.toArray();
    const emtpyMap: Record<string, T> = {};
    return items.reduce((acc, item) => {
      return { ...acc, [item.id]: item };
    }, emtpyMap);
  });

  const upsert = versionInvalidator((item: V) => table.put(item));

  return { getMap, upsert };
};

export const DB = {
  accounts: memoizedTable(db.table('accounts')),
  jars: memoizedTable(db.table('jars')),
  categories: memoizedTable(db.table('categories')),
  transactions: memoizedTable(db.table('transactions')),
  allocations: memoizedTable(db.table('allocations')),
  transfers: memoizedTable(db.table('transfers')),
};
