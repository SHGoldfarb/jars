import type { CurrencyAmount } from '../../shared';
import * as z from 'zod';

export const Archivable = z.object({
  archivedAtISO: z.iso.datetime().optional(),
});

export const Identifiable = z.object({
  id: z.uuidv4(),
});

export const Account = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  name: z.string(),
});

export type Account = z.infer<typeof Account>;

export const Jar = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  name: z.string(),
});

export type Jar = z.infer<typeof Jar>;

export const Category = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  name: z.string(),
  kind: z.enum(['income', 'expense']),
});

export type Category = z.infer<typeof Category>;

export const CategoryIncome = z.object({
  ...Category.shape,
  kind: z.literal('income'),
});

export type CategoryIncome = z.infer<typeof CategoryIncome>;

export const CategoryExpense = z.object({
  ...Category.shape,
  kind: z.literal('expense'),
});

export type CategoryExpense = z.infer<typeof CategoryExpense>;

// -----------------------------------
// ----------- OLD TYPES -------------
// -----------------------------------

export type ISODateTimeString = string;

export interface Archivable {
  archivedAtISO?: ISODateTimeString;
}

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
