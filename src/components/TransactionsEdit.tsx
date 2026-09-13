import { useNavigate } from '@tanstack/react-router';
import { TransactionUnsaved } from 'src/services/finance';
import { TransactionForm } from './TransactionForm';
import { useTransactionEditCurrentTransaction } from 'src/hooks/useTransactionEditCurrentTransaction';
import { transactionForm } from 'src/services/transaction-form';
import { yearMonth } from 'src/lib/yearMonth';

export const TransactionsEdit = () => {
  const transaction = useTransactionEditCurrentTransaction();
  const navigate = useNavigate();

  if (!transaction) {
    return null;
  }

  const handleSubmit = async (value: TransactionUnsaved) => {
    await transactionForm.commands.submitEditTransaction({ ...transaction, ...value });
    // The date is editable, so the month to return to is the submitted one, not the stored one.
    await navigate({ to: '/movements', search: { month: yearMonth.fromISO(value.dateISO) } });
  };
  const handleDelete = async () => {
    try {
      await transactionForm.commands.deleteTransaction({ transactionId: transaction.id });
      await navigate({
        to: '/movements',
        search: { month: yearMonth.fromISO(transaction.dateISO) },
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  return (
    <TransactionForm
      title="Create Transaction"
      onSubmit={handleSubmit}
      cancelMonth={yearMonth.fromISO(transaction.dateISO)}
      defaultErrorMessage={'Error creating transaction'}
      defaultValues={transactionForm.toFormValues(transaction)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
