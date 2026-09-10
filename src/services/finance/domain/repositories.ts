import type {
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

export interface AccountRepository {
  getById(accountId: string): Promise<Account>;
  list(): Promise<Account[]>;
  save(account: Account): Promise<unknown>;
  getLastOperationId: () => number;
}

export interface JarRepository {
  getById(jarId: string): Promise<Jar>;
  list(): Promise<Jar[]>;
  save(jar: Jar): Promise<unknown>;
  getLastOperationId: () => number;
}

export interface CategoryRepository {
  getById(categoryId: string): Promise<Category>;
  list(): Promise<Category[]>;
  listIncome(): Promise<CategoryIncome[]>;
  listExpense(): Promise<CategoryExpense[]>;
  save(category: Category): Promise<unknown>;
  getLastOperationId: () => number;
}

export interface MovementOrderItem {
  dateISO?: 'asc' | 'desc';
}

export interface TransactionRepository {
  getById(transactionId: string): Promise<Transaction>;
  list(): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<unknown>;
  getLastOperationId: () => number;
}

export interface TransferRepository {
  getById(transferId: string): Promise<Transfer>;
  list(): Promise<Transfer[]>;
  save(transfer: Transfer): Promise<unknown>;
  getLastOperationId: () => number;
}

export interface AllocationRepository {
  getById(allocationId: string): Promise<Allocation>;
  list(): Promise<Allocation[]>;
  save(allocation: Allocation): Promise<unknown>;
  getLastOperationId: () => number;
}

// Whole-database reads and writes belong to no single entity, so they get their own port.
// `replaceAll` and `clear` are atomic: a failure part way through leaves the previous state.
export interface FinanceDatabaseRepository {
  snapshot(): Promise<FinanceSnapshot>;
  replaceAll(snapshot: FinanceSnapshot): Promise<void>;
  clear(): Promise<void>;
}

export interface FinanceRepositories {
  accounts: AccountRepository;
  jars: JarRepository;
  categories: CategoryRepository;
  transactions: TransactionRepository;
  transfers: TransferRepository;
  allocations: AllocationRepository;
  database: FinanceDatabaseRepository;
}
