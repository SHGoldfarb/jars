import { useNavigate, useSearch } from '@tanstack/react-router';
import { financeCommands } from 'src/services/finance';
import { movementForm, type MovementDraft } from 'src/services/movement-form';
import { MovementForm } from './MovementForm';
import { yearMonth } from 'src/lib/yearMonth';
import { useMovementFormBookmarkValues } from 'src/hooks/useMovementFormBookmarkValues';

export const AllocationsNew = () => {
  const { month, bookmarkId } = useSearch({ from: '/allocations/new' });
  const navigate = useNavigate();
  const bookmark = useMovementFormBookmarkValues(movementForm.allocations, bookmarkId);
  const handleSubmit = async (draft: MovementDraft) => {
    const unsaved = movementForm.allocations.toUnsaved(draft);
    await financeCommands.allocations.create(unsaved);
    // Back to the month the movement landed in, not to today, so it is on screen where the user
    // left off.
    await navigate({ to: '/movements', search: { month: yearMonth.fromISO(unsaved.dateISO) } });
  };

  // The form reads its values once, on mount, so it waits for the bookmark's.
  if (!bookmark.ready) {
    return null;
  }

  return (
    <MovementForm
      movementForm={movementForm.allocations}
      title="Create Allocation"
      onSubmit={handleSubmit}
      cancelMonth={month}
      defaultValues={bookmark.values}
      defaultErrorMessage="Error creating allocation"
    />
  );
};
