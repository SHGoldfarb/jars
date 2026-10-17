import type { Bookmark } from 'src/services/finance';
import { AllocationListItem } from './AllocationListItem';
import { TransactionListItem } from './TransactionListItem';
import { TransferListItem } from './TransferListItem';

// A bookmark is listed exactly like the movement it was saved from, minus the date it never has.
export const BookmarkListItem = ({ bookmark }: { bookmark: Bookmark }) => {
  if (bookmark.movementType === 'transfer') {
    return <TransferListItem transfer={bookmark} />;
  }
  if (bookmark.movementType === 'allocation') {
    return <AllocationListItem allocation={bookmark} />;
  }
  return <TransactionListItem transaction={bookmark} />;
};
