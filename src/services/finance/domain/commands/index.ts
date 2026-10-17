import { accounts } from './account';
import { allocations } from './allocation';
import { bookmarks } from './bookmark';
import { categories } from './category';
import { database } from './database';
import { jars } from './jar';
import { subcategories } from './subcategory';
import { transactions } from './transaction';
import { transfers } from './transfer';

export { TransactionUnsaved } from './transaction';
export { TransferUnsaved } from './transfer';
export { AllocationUnsaved } from './allocation';
export { BookmarkUnsaved } from './bookmark';

export const financeDomainCommands = {
  accounts,
  categories,
  subcategories,
  jars,
  transactions,
  transfers,
  allocations,
  bookmarks,
  database,
};
