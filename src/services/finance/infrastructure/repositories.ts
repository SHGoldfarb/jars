import { DB } from './db';
import { Account, Category, CategoryExpense, CategoryIncome, Jar, Transaction } from '../model';
import type {
  AccountRepository,
  CategoryRepository,
  JarRepository,
  TransactionOrderItem,
  TransactionRepository,
} from '../domain';

const accountRepository: AccountRepository = {
  getById: async (accountId) => {
    return Account.parse((await DB.accounts.getMap())[accountId]);
  },
  list: async ({ includeArchived = false } = {}) => {
    const accounts = await DB.accounts.getMap();
    return Object.values(accounts)
      .filter((account) => Account.safeParse(account).success)
      .map((account) => Account.parse(account))
      .filter((account) => includeArchived || !account.archivedAtISO);
  },
  save: (account) => {
    return DB.accounts.upsert(Account.parse(account));
  },
};

const jarRepository: JarRepository = {
  getById: async (jarId) => {
    return Jar.parse((await DB.jars.getMap())[jarId]);
  },
  list: async ({ includeArchived = false } = {}) => {
    const jars = await DB.jars.getMap();
    return Object.values(jars)
      .filter((jar) => Jar.safeParse(jar).success)
      .map((jar) => Jar.parse(jar))
      .filter((jar) => includeArchived || !jar.archivedAtISO);
  },
  save: (jar) => {
    return DB.jars.upsert(Jar.parse(jar));
  },
};

const categoryRepository: CategoryRepository = {
  getById: async (categoryId) => {
    return Category.parse((await DB.categories.getMap())[categoryId]);
  },
  list: async ({ includeArchived = false } = {}) => {
    const categories = await DB.categories.getMap();
    return Object.values(categories)
      .filter((category) => Category.safeParse(category).success)
      .map((category) => Category.parse(category))
      .filter((category) => includeArchived || !category.archivedAtISO);
  },
  listIncome: async (params = {}) => {
    const categories = await categoryRepository.list(params);
    return categories
      .filter((category) => category.kind === 'income')
      .map((category) => CategoryIncome.parse(category));
  },
  listExpense: async (params = {}) => {
    const categories = await categoryRepository.list(params);
    return categories
      .filter((category) => category.kind === 'expense')
      .map((category) => CategoryExpense.parse(category));
  },
  save: (category) => {
    return DB.categories.upsert(Category.parse(category));
  },
};

// TODO: this shouldnt be in the infrastructure layer. Maybe domain?
const orderTransactions = (a: Transaction, b: Transaction, orderItem: TransactionOrderItem) => {
  let result: number | undefined = undefined;
  if (orderItem.dateISO === 'asc') {
    result = a.dateISO.localeCompare(b.dateISO);
  }
  if (orderItem.dateISO === 'desc') {
    result = b.dateISO.localeCompare(a.dateISO);
  }

  return result ?? 0;
};

const transactionRepository: TransactionRepository = {
  getById: async (transactionId) => {
    return Transaction.parse((await DB.transactions.getMap())[transactionId]);
  },
  list: async ({
    includeArchived = false,
    orderBy = [{ dateISO: 'desc' as 'asc' | 'desc' }],
  } = {}) => {
    const transactions = await DB.transactions.getMap();
    return Object.values(transactions)
      .filter((transaction) => Transaction.safeParse(transaction).success)
      .map((transaction) => Transaction.parse(transaction))
      .filter((transaction) => includeArchived || !transaction.archivedAtISO)
      .sort((a, b) => {
        for (const orderItem of orderBy) {
          const result = orderTransactions(a, b, orderItem);
          if (result !== 0) {
            return result;
          }
        }

        return 0;
      });
  },
  save: (transaction) => {
    return DB.transactions.upsert(Transaction.parse(transaction));
  },
};

export const repositories = {
  accounts: accountRepository,
  jars: jarRepository,
  categories: categoryRepository,
  transactions: transactionRepository,
};
