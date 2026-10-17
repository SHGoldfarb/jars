import * as z from 'zod';
import { AllocationBookmark, Bookmark, TransactionBookmark, TransferBookmark } from '../../model';

const unsaved = { id: true, createdAtISO: true, archivedAtISO: true } as const;

// What a form can supply: the movement's own fields, without what saving the bookmark adds.
export const BookmarkUnsaved = z.discriminatedUnion('movementType', [
  TransactionBookmark.omit(unsaved),
  TransferBookmark.omit(unsaved),
  AllocationBookmark.omit(unsaved),
]);

export type BookmarkUnsaved = z.infer<typeof BookmarkUnsaved>;

type NewBookmarkInput = BookmarkUnsaved & { id: string; createdAtISO: string };

export const bookmarks = {
  create: (input: NewBookmarkInput) => Bookmark.parse(input),
  archive: (bookmark: Bookmark, archivedAtISO = new Date().toISOString()) =>
    Bookmark.parse({ ...bookmark, archivedAtISO }),
};
