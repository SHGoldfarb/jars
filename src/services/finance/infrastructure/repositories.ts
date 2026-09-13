import { DB } from './db';
import {
  Account,
  Allocation,
  Category,
  CategoryExpense,
  CategoryIncome,
  FinanceSnapshot,
  Jar,
  Transaction,
  Transfer,
} from '../model';
import type {
  AccountRepository,
  AllocationRepository,
  CategoryRepository,
  FinanceDatabaseRepository,
  JarRepository,
  TransactionRepository,
  TransferRepository,
} from '../domain';
import type z from 'zod';

const createDBTableRepository = <T extends z.ZodObject>(
  Model: T,
  table: 'accounts' | 'jars' | 'categories' | 'transactions' | 'transfers' | 'allocations'
) => ({
  getById: async (id: string) => {
    return Model.parse((await DB[table].getMap())[id]);
  },
  // A row that does not parse is dropped rather than failing the whole list, so one bad record
  // cannot take a screen down.
  list: async () => {
    const items = await DB[table].getMap();
    return Object.values(items)
      .map((item) => Model.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  },
  save: (item: z.infer<T>) => {
    return DB[table].upsert(Model.parse(item));
  },
  getLastOperationId: () => DB[table].getStateVersion(),
});

const accountRepository: AccountRepository = createDBTableRepository(Account, 'accounts');

const jarRepository: JarRepository = createDBTableRepository(Jar, 'jars');

const categoryRepository: CategoryRepository = {
  ...createDBTableRepository(Category, 'categories'),
  listIncome: async () => {
    const categories = await categoryRepository.list();
    return categories
      .filter((category) => category.kind === 'income')
      .map((category) => CategoryIncome.parse(category));
  },
  listExpense: async () => {
    const categories = await categoryRepository.list();
    return categories
      .filter((category) => category.kind === 'expense')
      .map((category) => CategoryExpense.parse(category));
  },
};

const transactionRepository: TransactionRepository = createDBTableRepository(
  Transaction,
  'transactions'
);

const transferRepository: TransferRepository = createDBTableRepository(Transfer, 'transfers');

const allocationRepository: AllocationRepository = createDBTableRepository(
  Allocation,
  'allocations'
);

const databaseRepository: FinanceDatabaseRepository = {
  snapshot: async () => FinanceSnapshot.parse(await DB.snapshot()),
  replaceAll: (snapshot: FinanceSnapshot) => DB.replaceAll(FinanceSnapshot.parse(snapshot)),
  clear: () => DB.clear(),
};

export const repositories = {
  accounts: accountRepository,
  jars: jarRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  transfers: transferRepository,
  allocations: allocationRepository,
  database: databaseRepository,
};
