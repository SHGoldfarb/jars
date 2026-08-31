import { useNavigate } from '@tanstack/react-router';
import { TransactionUnsaved } from 'src/services/finance';
import { TransactionForm } from './TransactionForm';
import { useTransactionEditCurrentTransaction } from 'src/hooks/useTransactionEditCurrentTransaction';
import { transactionForm } from 'src/services/transaction-form';

export const TransactionsEdit = () => {
  const transaction = useTransactionEditCurrentTransaction();
  const navigate = useNavigate();

  if (!transaction) {
    return null;
  }

  const onCancelLink = '/movements';
  const handleSubmit = async (value: TransactionUnsaved) => {
    await transactionForm.commands.submitEditTransaction({ ...transaction, ...value });
    await navigate({ to: '/movements' });
  };
  const handleDelete = async () => {
    try {
      await transactionForm.commands.deleteTransaction({ transactionId: transaction.id });
      await navigate({ to: '/movements' });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  return (
    <TransactionForm
      title="Create Transaction"
      onSubmit={handleSubmit}
      onCancelRoute={onCancelLink}
      defaultErrorMessage={'Error creating transaction'}
      defaultValues={transactionForm.toFormValues(transaction)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
