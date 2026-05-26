import * as z from 'zod';
import { CurrencyAmount } from './currency';

const idShape = z.uuidv4();
const dateTimeShape = z.iso.datetime();

const Archivable = z.object({
  archivedAtISO: dateTimeShape.optional(),
});

type Archivable = z.infer<typeof Archivable>;

const Identifiable = z.object({
  id: idShape,
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

export const Transaction = z.object({
  ...Identifiable.shape,
  ...Archivable.shape,
  kind: z.enum(['income', 'expense']),
  accountId: idShape,
  categoryId: idShape,
  jarId: idShape,
  amount: CurrencyAmount,
  dateISO: dateTimeShape,
  description: z.string(),
});

export type Transaction = z.infer<typeof Transaction>;

export const TransactionUnsaved = z.object({
  ...Transaction.shape,
  id: Transaction.shape.id.optional(),
});

export type TransactionUnsaved = z.infer<typeof TransactionUnsaved>;

// -----------------------------------
// ----------- OLD TYPES -------------
// -----------------------------------

export type Transfer = Archivable & {
  id: string;
  dateISO: string;
  originAccountId: string;
  destinationAccountId: string;
  description: string;
  amount: CurrencyAmount; // Always positive.
};

export type Allocation = Archivable & {
  id: string;
  dateISO: string;
  originJarId: string;
  destinationJarId: string;
  description: string;
  amount: CurrencyAmount; // Always positive.
};
