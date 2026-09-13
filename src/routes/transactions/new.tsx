import { createFileRoute } from '@tanstack/react-router';
import { movementsSearchSchema } from 'src/routes/movements';
import { TransactionsNew } from 'components/TransactionsNew';

export const Route = createFileRoute('/transactions/new')({
  component: TransactionsNew,
  // Carries the month the user was browsing, so cancelling returns to it.
  validateSearch: movementsSearchSchema,
});
