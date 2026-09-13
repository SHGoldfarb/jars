import { createFileRoute } from '@tanstack/react-router';
import { movementsSearchSchema } from 'src/routes/movements';
import { AllocationsNew } from 'src/components/AllocationsNew';

export const Route = createFileRoute('/allocations/new')({
  component: AllocationsNew,
  // Carries the month the user was browsing, so cancelling returns to it.
  validateSearch: movementsSearchSchema,
});
