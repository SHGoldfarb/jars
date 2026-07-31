import * as z from 'zod';
import { Transaction } from '../../model';

export const TransactionUnsaved = z.object({
  ...Transaction.shape,
  id: Transaction.shape.id.optional(),
});

export type TransactionUnsaved = z.infer<typeof TransactionUnsaved>;

const NewTransactionInput = z.object({
  id: Transaction.shape.id,
  kind: Transaction.shape.kind,
  accountId: Transaction.shape.accountId,
  categoryId: Transaction.shape.categoryId,
  jarId: Transaction.shape.jarId,
  amount: Transaction.shape.amount,
  dateISO: Transaction.shape.dateISO,
  description: Transaction.shape.description,
});

type NewTransactionInput = z.infer<typeof NewTransactionInput>;

export const transactions = {
  create: (input: NewTransactionInput) => Transaction.parse(input),
  update: (input: Transaction) => Transaction.parse(input),
  archive: (transaction: Transaction, archivedAtISO = new Date().toISOString()) =>
    Transaction.parse({ ...transaction, archivedAtISO }),
};
