import { useNavigate, useParams } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { useTransfer } from 'src/hooks/useTransfer';
import { MovementForm } from './MovementForm';
import { yearMonth } from 'src/lib/yearMonth';

export const TransfersEdit = () => {
  const { transferId } = useParams({ from: '/transfers/$transferId/edit' });
  const transfer = useTransfer(transferId);
  const navigate = useNavigate();

  if (!transfer) {
    return null;
  }

  const handleSubmit = async (draft: MovementDraft) => {
    const unsaved = movementForm.transfers.toUnsaved(draft);
    await movementForm.transfers.commands.submitEdit({ ...transfer, ...unsaved });
    // The date is editable, so the month to return to is the submitted one, not the stored one.
    await navigate({ to: '/movements', search: { month: yearMonth.fromISO(unsaved.dateISO) } });
  };
  const handleDelete = async () => {
    try {
      await financeCommands.transfers.archive({ transferId: transfer.id });
      await navigate({ to: '/movements', search: { month: yearMonth.fromISO(transfer.dateISO) } });
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
      cancelMonth={yearMonth.fromISO(transfer.dateISO)}
      defaultErrorMessage="Error editing transfer"
      defaultValues={movementForm.transfers.toFormValues(transfer)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
