import { DB } from './db';
import {
  Account,
  Allocation,
  Bookmark,
  Category,
  CategoryExpense,
  CategoryIncome,
  FinanceSnapshot,
  Jar,
  Subcategory,
  Transaction,
  Transfer,
} from '../model';
import type {
  AccountRepository,
  AllocationRepository,
  BookmarkRepository,
  CategoryRepository,
  FinanceDatabaseRepository,
  JarRepository,
  SubcategoryRepository,
  TransactionRepository,
  TransferRepository,
} from '../domain';
import type z from 'zod';

// Typed on any schema, not just objects: a bookmark is a union of one object per movement kind,
// and all this needs of a schema is to parse with it.
const createDBTableRepository = <T extends z.ZodType>(
  Model: T,
  table:
    | 'accounts'
    | 'jars'
    | 'categories'
    | 'subcategories'
    | 'transactions'
    | 'transfers'
    | 'allocations'
    | 'bookmarks'
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

const subcategoryRepository: SubcategoryRepository = createDBTableRepository(
  Subcategory,
  'subcategories'
);

const transactionRepository: TransactionRepository = createDBTableRepository(
  Transaction,
  'transactions'
);

const transferRepository: TransferRepository = createDBTableRepository(Transfer, 'transfers');

const allocationRepository: AllocationRepository = createDBTableRepository(
  Allocation,
  'allocations'
);

const bookmarkRepository: BookmarkRepository = createDBTableRepository(Bookmark, 'bookmarks');

const databaseRepository: FinanceDatabaseRepository = {
  snapshot: async () => FinanceSnapshot.parse(await DB.snapshot()),
  replaceAll: (snapshot: FinanceSnapshot) => DB.replaceAll(FinanceSnapshot.parse(snapshot)),
  clear: () => DB.clear(),
};

export const repositories = {
  accounts: accountRepository,
  jars: jarRepository,
  categories: categoryRepository,
  subcategories: subcategoryRepository,
  transactions: transactionRepository,
  transfers: transferRepository,
  allocations: allocationRepository,
  bookmarks: bookmarkRepository,
  database: databaseRepository,
};
