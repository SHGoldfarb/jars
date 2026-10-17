import { createFileRoute } from '@tanstack/react-router';
import { newMovementSearchSchema } from 'src/routes/movements';
import { AllocationsNew } from 'src/components/AllocationsNew';

export const Route = createFileRoute('/allocations/new')({
  component: AllocationsNew,
  // Carries the month the user was browsing, so cancelling returns to it, and the bookmark the
  // movement is started from, if any.
  validateSearch: newMovementSearchSchema,
});
