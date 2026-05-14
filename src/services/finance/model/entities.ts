import type { CurrencyAmount } from '../../shared';

export type ISODateTimeString = string;

export interface Archivable {
  archivedAtISO?: ISODateTimeString;
}

type CategoryBase = Archivable & {
  id: string;
  name: string;
};

export type CategoryKind = 'income' | 'expense';

export type IncomeCategory = CategoryBase & {
  kind: 'income';
};

export type ExpenseCategory = CategoryBase & {
  kind: 'expense';
};

export type Category = IncomeCategory | ExpenseCategory;

export type Jar = Archivable & {
  id: string;
  name: string;
};

export type TransactionKind = 'income' | 'expense';

type TransactionBase = Archivable & {
  id: string;
  kind: TransactionKind;
  accountId: string;
  jarId: string;
  amount: CurrencyAmount; // Always positive; sign is derived from kind.
  dateISO: string;
  notes: string;
  categoryId: string;
};

export type IncomeTransaction = TransactionBase & {
  kind: 'income';
};

export type ExpenseTransaction = TransactionBase & {
  kind: 'expense';
};

export type Transaction = IncomeTransaction | ExpenseTransaction;

export type Transfer = Archivable & {
  id: string;
  dateISO: string;
  originAccountId: string;
  destinationAccountId: string;
  notes: string;
  amount: CurrencyAmount; // Always positive.
};

export type Allocation = Archivable & {
  id: string;
  dateISO: string;
  originJarId: string;
  destinationJarId: string;
  notes: string;
  amount: CurrencyAmount; // Always positive.
};
