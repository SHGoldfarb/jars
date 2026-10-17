import { useNavigate, useSearch } from '@tanstack/react-router';
import { TransactionUnsaved } from 'src/services/finance';
import { TransactionForm } from './TransactionForm';
import { transactionForm } from 'src/services/transaction-form';
import { yearMonth } from 'src/lib/yearMonth';
import { useTransactionFormBookmarkValues } from 'src/hooks/useTransactionFormBookmarkValues';

export const TransactionsNew = () => {
  const { month, bookmarkId } = useSearch({ from: '/transactions/new' });
  const navigate = useNavigate();
  const bookmark = useTransactionFormBookmarkValues(bookmarkId);
  const handleSubmit = async (value: TransactionUnsaved) => {
    await transactionForm.commands.submitCreateTransaction(value);
    // Back to the month the transaction landed in, not to today, so it is on screen where the
    // user left off.
    await navigate({ to: '/movements', search: { month: yearMonth.fromISO(value.dateISO) } });
  };

  // The form reads its values once, on mount, so it waits for the bookmark's.
  if (!bookmark.ready) {
    return null;
  }

  return (
    <TransactionForm
      title="Create Transaction"
      onSubmit={handleSubmit}
      cancelMonth={month}
      defaultErrorMessage={'Error creating transaction'}
      defaultValues={bookmark.values}
    />
  );
};
