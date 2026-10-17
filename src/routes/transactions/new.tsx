import { createFileRoute } from '@tanstack/react-router';
import { newMovementSearchSchema } from 'src/routes/movements';
import { TransactionsNew } from 'components/TransactionsNew';

export const Route = createFileRoute('/transactions/new')({
  component: TransactionsNew,
  // Carries the month the user was browsing, so cancelling returns to it, and the bookmark the
  // movement is started from, if any.
  validateSearch: newMovementSearchSchema,
});
