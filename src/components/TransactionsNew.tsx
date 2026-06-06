import { useNavigate } from '@tanstack/react-router';
import { financeCommands, TransactionUnsaved } from 'src/services/finance';
import { TransactionForm } from './TransactionForm';

export const TransactionsNew = () => {
  const navigate = useNavigate();
  const onCancelLink = '/movements';
  const handleSubmit = async (value: TransactionUnsaved) => {
    await financeCommands.createTransaction(value);
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
