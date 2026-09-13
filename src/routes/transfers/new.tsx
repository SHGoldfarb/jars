import { createFileRoute } from '@tanstack/react-router';
import { movementsSearchSchema } from 'src/routes/movements';
import { TransfersNew } from 'src/components/TransfersNew';

export const Route = createFileRoute('/transfers/new')({
  component: TransfersNew,
  // Carries the month the user was browsing, so cancelling returns to it.
  validateSearch: movementsSearchSchema,
});
