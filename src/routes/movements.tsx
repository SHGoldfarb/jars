import { createFileRoute } from '@tanstack/react-router';
import * as z from 'zod';
import { Movements } from 'src/components/Movements';
import { YearMonthKey } from 'src/lib/yearMonth';

export const movementsSearchSchema = z.object({
  // A hand-edited or stale URL degrades to "no month", which the view reads as the current month -
  // better than an error boundary on a bookmarked link.
  month: YearMonthKey.optional().catch(undefined),
});

export const Route = createFileRoute('/movements')({
  component: Movements,
  validateSearch: movementsSearchSchema,
});
