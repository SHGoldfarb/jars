import { useNavigate } from '@tanstack/react-router';
import { TransferUnsaved } from 'src/services/finance';
import { financeCommands } from 'src/services/finance/application';
import { TransferForm } from './TransferForm';

export const TransfersNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (value: TransferUnsaved) => {
    await financeCommands.transfers.create(value);
    await navigate({ to: '/movements' });
  };

  return (
    <TransferForm
      title="Create Transfer"
      onSubmit={handleSubmit}
      onCancelRoute="/movements"
      defaultErrorMessage="Error creating transfer"
    />
  );
};
