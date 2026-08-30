import { accounts } from './account';
import { categories } from './category';
import { jars } from './jar';
import { transactions } from './transaction';
import { transfers } from './transfer';

export { TransactionUnsaved } from './transaction';
export { TransferUnsaved } from './transfer';

export const financeDomainCommands = {
  accounts,
  categories,
  jars,
  transactions,
  transfers,
};
