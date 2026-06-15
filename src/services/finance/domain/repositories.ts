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
  list(): Promise<Account[]>;
  save(account: Account): Promise<unknown>;
}

export interface JarRepository {
  getById(jarId: string): Promise<Jar>;
  list(): Promise<Jar[]>;
  save(jar: Jar): Promise<unknown>;
}

export interface CategoryRepository {
  getById(categoryId: string): Promise<Category>;
  list(): Promise<Category[]>;
  listIncome(): Promise<CategoryIncome[]>;
  listExpense(): Promise<CategoryExpense[]>;
  save(category: Category): Promise<unknown>;
}

export interface TransactionOrderItem {
  dateISO?: 'asc' | 'desc';
}

export interface TransactionRepository {
  getById(transactionId: string): Promise<Transaction>;
  list(): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<unknown>;
}

export interface FinanceRepositories {
  accounts: AccountRepository;
  jars: JarRepository;
  categories: CategoryRepository;
  transactions: TransactionRepository;
}
