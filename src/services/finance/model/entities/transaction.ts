import * as z from 'zod';
import { CurrencyAmount } from '../currency';
import { Archivable, Identifiable, dateTimeShape, idShape } from './shared';

export const Transaction = z.object({
  ...Identifiable.shape,
  ...Archivable.shape,
  kind: z.enum(['income', 'expense']),
  accountId: idShape,
  categoryId: idShape,
  jarId: idShape,
  amount: CurrencyAmount,
  dateISO: dateTimeShape,
  description: z.string().trim(),
});

export type Transaction = z.infer<typeof Transaction>;

export const TransactionUnsaved = z.object({
  ...Transaction.shape,
  id: Transaction.shape.id.optional(),
});

export type TransactionUnsaved = z.infer<typeof TransactionUnsaved>;

const NewTransactionInput = z.object({
  id: Identifiable.shape.id,
  kind: Transaction.shape.kind,
  accountId: Transaction.shape.accountId,
  categoryId: Transaction.shape.categoryId,
  jarId: Transaction.shape.jarId,
  amount: Transaction.shape.amount,
  dateISO: Transaction.shape.dateISO,
  description: Transaction.shape.description,
});

type NewTransactionInput = z.infer<typeof NewTransactionInput>;

export const createTransaction = (input: NewTransactionInput) => Transaction.parse(input);

export const archiveTransaction = (
  transaction: Transaction,
  archivedAtISO = new Date().toISOString()
) => Transaction.parse({ ...transaction, archivedAtISO });
