import { useNavigate, useSearch } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { MovementForm } from './MovementForm';
import { yearMonth } from 'src/lib/yearMonth';

export const TransfersNew = () => {
  const { month } = useSearch({ from: '/transfers/new' });
  const navigate = useNavigate();
  const handleSubmit = async (draft: MovementDraft) => {
    const unsaved = movementForm.transfers.toUnsaved(draft);
    await financeCommands.transfers.create(unsaved);
    // Back to the month the movement landed in, not to today, so it is on screen where the user
    // left off.
    await navigate({ to: '/movements', search: { month: yearMonth.fromISO(unsaved.dateISO) } });
  };

  return (
    <MovementForm
      movementForm={movementForm.transfers}
      title="Create Transfer"
      onSubmit={handleSubmit}
      cancelMonth={month}
      defaultErrorMessage="Error creating transfer"
    />
  );
};
