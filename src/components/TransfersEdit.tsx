import { useNavigate, useParams } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { useTransfer } from 'src/hooks/useTransfer';
import { MovementForm } from './MovementForm';

export const TransfersEdit = () => {
  const { transferId } = useParams({ from: '/transfers/$transferId/edit' });
  const transfer = useTransfer(transferId);
  const navigate = useNavigate();

  if (!transfer) {
    return null;
  }

  const handleSubmit = async (draft: MovementDraft) => {
    await movementForm.transfers.commands.submitEdit({
      ...transfer,
      ...movementForm.transfers.toUnsaved(draft),
    });
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
    <MovementForm
      movementForm={movementForm.transfers}
      movementId={transfer.id}
      title="Edit Transfer"
      onSubmit={handleSubmit}
      onCancelRoute="/movements"
      defaultErrorMessage="Error editing transfer"
      defaultValues={movementForm.transfers.toFormValues(transfer)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
