import { Dexie, type Table } from 'dexie';
import { memoize } from 'src/lib/utils';

const db = new Dexie('JarsMainDatabase');

db.version(2).stores({
  accounts: '&id',
  jars: '&id',
  categories: '&id',
  transactions: '&id, accountId, jarId',
  allocations: '&id, originJarId, destinationJarId',
  transfers: '&id, originAccountId, destinationAccountId',
});

const tableWithCache = <T, U, V>(table: Table<T, U, V>) => {
  let cacheVersion = 0;

  const makeMemoized = <U extends unknown[], V>(foo: (...params: U) => V) => {
    const memoizedFoo = memoize((_: number, ...params: U) => {
      return foo(...params);
    });
    return (...params: U) => {
      return memoizedFoo(cacheVersion, ...params);
    };
  };

  const makeInvalidator =
    <U extends unknown[], V>(foo: (...args: U) => Promise<V>) =>
    async (...args: U) => {
      const result = await foo(...args);
      cacheVersion++;
      return result;
    };

  return {
    get: makeMemoized((id: U) => table.get(id)),
    put: makeInvalidator(table.put.bind(table)),
    toArray: makeMemoized(() => table.toArray()),
    add: makeInvalidator(table.add.bind(table)),
    withoutCache: table,
  };
};

export const DB = {
  accounts: tableWithCache(db.table('accounts')),
  jars: tableWithCache(db.table('jars')),
  categories: tableWithCache(db.table('categories')),
};
