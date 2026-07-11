import { Dexie, type Table } from 'dexie';
import { makeVersionedMemoize } from 'src/lib/utils';
import z from 'zod';

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

const memoizedTable = <T extends { id: string }, U, V>(table: Table<T, U, V>) => {
  const { versionedMemoize, versionInvalidator } = makeVersionedMemoize(3);

  const getMap = versionedMemoize(async () => {
    const items = await table.toArray();
    const emptyMap: Record<string, T> = {};
    return items.reduce((acc, item) => {
      return { ...acc, [item.id]: item };
    }, emptyMap);
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
