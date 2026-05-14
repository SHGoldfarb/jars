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

const getAccounts = () => {
  return db.table('accounts').toArray();
};

const createAccount = (account: { id: string }) => {
  return db.table('accounts').add(account);
};

export const DB = {
  getAccounts,
  createAccount,
};
