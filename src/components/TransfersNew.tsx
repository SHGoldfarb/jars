import { useNavigate } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { MovementForm } from './MovementForm';

export const TransfersNew = () => {
  const navigate = useNavigate();
  const handleSubmit = async (draft: MovementDraft) => {
    await financeCommands.transfers.create(movementForm.transfers.toUnsaved(draft));
    await navigate({ to: '/movements' });
  };

  return (
    <MovementForm
      movementForm={movementForm.transfers}
      title="Create Transfer"
      onSubmit={handleSubmit}
      onCancelRoute="/movements"
      defaultErrorMessage="Error creating transfer"
    />
  );
};
