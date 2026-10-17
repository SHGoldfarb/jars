import * as z from 'zod';
import { Allocation } from './allocation';
import { Archivable, Identifiable, dateTimeShape } from './shared';
import { Transaction } from './transaction';
import { Transfer } from './transfer';

// A bookmark is a copy of a movement's fields, taken when it is saved, so it never follows the
// movement it came from. Built from the movement's own schema, so a field added to a movement is
// one its bookmark carries too. The date is the one field left out: a movement started from a
// bookmark takes the form's default date, so there is nothing to keep.
const notBookmarked = { id: true, dateISO: true, archivedAtISO: true } as const;

const BookmarkBase = z.object({
  ...Identifiable.shape,
  ...Archivable.shape,
  createdAtISO: dateTimeShape,
});

export const TransactionBookmark = z.object({
  ...BookmarkBase.shape,
  ...Transaction.omit(notBookmarked).shape,
  movementType: z.literal('transaction'),
});

export type TransactionBookmark = z.infer<typeof TransactionBookmark>;

export const TransferBookmark = z.object({
  ...BookmarkBase.shape,
  ...Transfer.omit(notBookmarked).shape,
  movementType: z.literal('transfer'),
});

export type TransferBookmark = z.infer<typeof TransferBookmark>;

export const AllocationBookmark = z.object({
  ...BookmarkBase.shape,
  ...Allocation.omit(notBookmarked).shape,
  movementType: z.literal('allocation'),
});

export type AllocationBookmark = z.infer<typeof AllocationBookmark>;

// Discriminated on the same `movementType` the movements list uses, so code switching on it
// reads the same for a movement and for its bookmark.
export const Bookmark = z.discriminatedUnion('movementType', [
  TransactionBookmark,
  TransferBookmark,
  AllocationBookmark,
]);

export type Bookmark = z.infer<typeof Bookmark>;
