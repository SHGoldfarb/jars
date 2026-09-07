import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { MovementForm } from './MovementForm';

export const AllocationsNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (draft: MovementDraft) => {
    await financeCommands.allocations.create(movementForm.allocations.toUnsaved(draft));
    await navigate({ to: '/movements' });
  };

  return (
    <MovementForm
      movementForm={movementForm.allocations}
      title="Create Allocation"
      onSubmit={handleSubmit}
      onCancelRoute="/movements"
      defaultErrorMessage="Error creating allocation"
    />
  );
};
