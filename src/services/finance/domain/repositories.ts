import type {
  Account,
  Category,
  CategoryExpense,
  CategoryIncome,
  Jar,
  Transaction,
} from '../model';

export interface AccountRepository {
  getById(accountId: string): Promise<Account>;
  list(params?: { includeArchived?: boolean }): Promise<Account[]>;
  save(account: Account): Promise<unknown>;
}

export interface JarRepository {
  getById(jarId: string): Promise<Jar>;
  list(params?: { includeArchived?: boolean }): Promise<Jar[]>;
  save(jar: Jar): Promise<unknown>;
}

export interface CategoryRepository {
  getById(categoryId: string): Promise<Category>;
  list(params?: { includeArchived?: boolean }): Promise<Category[]>;
  listIncome(params?: { includeArchived?: boolean }): Promise<CategoryIncome[]>;
  listExpense(params?: { includeArchived?: boolean }): Promise<CategoryExpense[]>;
  save(category: Category): Promise<unknown>;
}

export interface TransactionOrderItem {
  dateISO?: 'asc' | 'desc';
}

export interface TransactionRepository {
  getById(transactionId: string): Promise<Transaction>;
  list(params?: {
    includeArchived?: boolean;
    orderBy?: TransactionOrderItem[];
  }): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<unknown>;
}

export interface FinanceRepositories {
  accounts: AccountRepository;
  jars: JarRepository;
  categories: CategoryRepository;
  transactions: TransactionRepository;
}
