import * as z from 'zod';
import { Transfer } from '../../model';

export const TransferUnsaved = z.object({
  ...Transfer.shape,
  id: Transfer.shape.id.optional(),
});

export type TransferUnsaved = z.infer<typeof TransferUnsaved>;

const NewTransferInput = z.object({
  id: Transfer.shape.id,
  originAccountId: Transfer.shape.originAccountId,
  destinationAccountId: Transfer.shape.destinationAccountId,
  amount: Transfer.shape.amount,
  dateISO: Transfer.shape.dateISO,
  description: Transfer.shape.description,
});

type NewTransferInput = z.infer<typeof NewTransferInput>;

const ensureDistinctAccounts = (
  transfer: Pick<Transfer, 'originAccountId' | 'destinationAccountId'>
) => {
  if (transfer.originAccountId === transfer.destinationAccountId) {
    throw new Error('Origin and destination accounts must be different');
  }
};

export const transfers = {
  create: (input: NewTransferInput) => {
    const transfer = Transfer.parse(input);
    ensureDistinctAccounts(transfer);
    return transfer;
  },
  update: (input: Transfer) => {
    const transfer = Transfer.parse(input);
    ensureDistinctAccounts(transfer);
    return transfer;
  },
  archive: (transfer: Transfer, archivedAtISO = new Date().toISOString()) =>
    Transfer.parse({ ...transfer, archivedAtISO }),
};
