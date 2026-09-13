import { useNavigate, useParams } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { useAllocation } from 'src/hooks/useAllocation';
import { MovementForm } from './MovementForm';
import { yearMonth } from 'src/lib/yearMonth';

export const AllocationsEdit = () => {
  const { allocationId } = useParams({ from: '/allocations/$allocationId/edit' });
  const allocation = useAllocation(allocationId);
  const navigate = useNavigate();

  if (!allocation) {
    return null;
  }

  const handleSubmit = async (draft: MovementDraft) => {
    const unsaved = movementForm.allocations.toUnsaved(draft);
    await movementForm.allocations.commands.submitEdit({ ...allocation, ...unsaved });
    // The date is editable, so the month to return to is the submitted one, not the stored one.
    await navigate({ to: '/movements', search: { month: yearMonth.fromISO(unsaved.dateISO) } });
  };
  const handleDelete = async () => {
    try {
      await financeCommands.allocations.archive({ allocationId: allocation.id });
      await navigate({
        to: '/movements',
        search: { month: yearMonth.fromISO(allocation.dateISO) },
      });
    } catch (error) {
      console.error('Failed to delete allocation:', error);
    }
  };

  return (
    <MovementForm
      movementForm={movementForm.allocations}
      movementId={allocation.id}
      title="Edit Allocation"
      onSubmit={handleSubmit}
      cancelMonth={yearMonth.fromISO(allocation.dateISO)}
      defaultErrorMessage="Error editing allocation"
      defaultValues={movementForm.allocations.toFormValues(allocation)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
