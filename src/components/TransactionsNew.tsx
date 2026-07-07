import { useNavigate } from '@tanstack/react-router';
import { TransactionUnsaved } from 'src/services/finance';
import { TransactionForm } from './TransactionForm';
import { transactionFormCommands } from 'src/services/transaction-form/application/commands';

export const TransactionsNew = () => {
  const navigate = useNavigate();
  const onCancelLink = '/movements';
  const handleSubmit = async (value: TransactionUnsaved) => {
    await transactionFormCommands.submitCreateTransaction(value);
    await navigate({ to: '/movements' });
  };

  return (
    <TransactionForm
      title="Create Transaction"
      onSubmit={handleSubmit}
      onCancelRoute={onCancelLink}
      defaultErrorMessage={'Error creating transaction'}
    />
  );
};
