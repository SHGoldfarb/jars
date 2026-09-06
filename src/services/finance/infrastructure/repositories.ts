import { DB } from './db';
import {
  Account,
  Allocation,
  Category,
  CategoryExpense,
  CategoryIncome,
  Jar,
  Transaction,
  Transfer,
} from '../model';
import type {
  AccountRepository,
  AllocationRepository,
  CategoryRepository,
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
  list: async () => {
    const items = await DB[table].getMap();
    return Object.values(items)
      .filter((item) => Model.safeParse(item).success)
      .map((item) => Model.parse(item));
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

export const repositories = {
  accounts: accountRepository,
  jars: jarRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
  transfers: transferRepository,
  allocations: allocationRepository,
};
