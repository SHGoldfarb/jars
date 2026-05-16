import { Dexie } from 'dexie';

const db = new Dexie('JarsMainDatabase');

db.version(2).stores({
  accounts: '&id',
  jars: '&id',
  categories: '&id',
  transactions: '&id, accountId, jarId',
  allocations: '&id, originJarId, destinationJarId',
  transfers: '&id, originAccountId, destinationAccountId',
});

export const DB = {
  accounts: db.table('accounts'),
  jars: db.table('jars'),
};
