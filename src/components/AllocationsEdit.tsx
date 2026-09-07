import { useNavigate, useParams } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { useAllocation } from 'src/hooks/useAllocation';
import { MovementForm } from './MovementForm';

export const AllocationsEdit = () => {
  const { allocationId } = useParams({ from: '/allocations/$allocationId/edit' });
  const allocation = useAllocation(allocationId);
  const navigate = useNavigate();

  if (!allocation) {
    return null;
  }

  const handleSubmit = async (draft: MovementDraft) => {
    await movementForm.allocations.commands.submitEdit({
      ...allocation,
      ...movementForm.allocations.toUnsaved(draft),
    });
    await navigate({ to: '/movements' });
  };
  const handleDelete = async () => {
    try {
      await financeCommands.allocations.archive({ allocationId: allocation.id });
      await navigate({ to: '/movements' });
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
      onCancelRoute="/movements"
      defaultErrorMessage="Error editing allocation"
      defaultValues={movementForm.allocations.toFormValues(allocation)}
      onDelete={() => {
        void handleDelete();
      }}
    />
  );
};
