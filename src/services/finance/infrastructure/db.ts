import { Dexie } from 'dexie';

const db = new Dexie('FriendsDatabase');

db.version(1).stores({
  accounts: '&id',
  jars: '&id',
  incomeCategories: '&id',
  expenseCategories: '&id',
  transactions: '&id, accountId, jarId',
  allocations: '&id, originJarId, destinationJarId',
  transfers: '&id, originAccountId, destinationAccountId',
});

export { db };
