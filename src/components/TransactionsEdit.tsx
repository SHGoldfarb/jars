import { useNavigate, useParams } from '@tanstack/react-router';
import { financeCommands, TransactionUnsaved } from 'src/services/finance';
import { TransactionForm } from './TransactionForm';
import { useTransaction } from 'src/hooks/useTransaction';
import { transactionFormUtils } from 'src/lib/transactionFormUtils';

export const TransactionsEdit = () => {
  const { transactionId } = useParams({ strict: false });
  const transaction = useTransaction(transactionId ?? '');
  const navigate = useNavigate();

  if (!transaction) {
    return null;
  }

  const onCancelLink = '/movements';
  const handleSubmit = async (value: TransactionUnsaved) => {
    await financeCommands.updateTransaction({ ...transaction, ...value });
    await navigate({ to: '/movements' });
  };
  const handleDelete = async () => {
    try {
      await financeCommands.archiveTransaction({ transactionId: transaction.id });
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
      defaultValues={transactionFormUtils.toFormValues(transaction)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
