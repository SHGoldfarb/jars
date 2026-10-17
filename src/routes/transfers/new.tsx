import { createFileRoute } from '@tanstack/react-router';
import { newMovementSearchSchema } from 'src/routes/movements';
import { TransfersNew } from 'src/components/TransfersNew';

export const Route = createFileRoute('/transfers/new')({
  component: TransfersNew,
  // Carries the month the user was browsing, so cancelling returns to it, and the bookmark the
  // movement is started from, if any.
  validateSearch: newMovementSearchSchema,
});
