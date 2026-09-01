import { useNavigate } from '@tanstack/react-router';
import { financeCommands, TransferUnsaved } from 'src/services/finance';
import { transferForm } from 'src/services/transfer-form';
import { useTransferEditCurrentTransfer } from 'src/hooks/useTransferEditCurrentTransfer';
import { TransferForm } from './TransferForm';

export const TransfersEdit = () => {
  const transfer = useTransferEditCurrentTransfer();
  const navigate = useNavigate();

  if (!transfer) {
    return null;
  }

  const handleSubmit = async (value: TransferUnsaved) => {
    await financeCommands.transfers.update({ ...transfer, ...value });
    await navigate({ to: '/movements' });
  };
  const handleDelete = async () => {
    try {
      await financeCommands.transfers.archive({ transferId: transfer.id });
      await navigate({ to: '/movements' });
    } catch (error) {
      console.error('Failed to delete transfer:', error);
    }
  };

  return (
    <TransferForm
      title="Edit Transfer"
      onSubmit={handleSubmit}
      onCancelRoute="/movements"
      defaultErrorMessage="Error editing transfer"
      defaultValues={transferForm.toFormValues(transfer)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
