import { createFileRoute } from '@tanstack/react-router';
import * as z from 'zod';
import { Movements } from 'src/components/Movements';
import { YearMonthKey } from 'src/lib/yearMonth';

export const movementsSearchSchema = z.object({
  // A hand-edited or stale URL degrades to "no month", which the view reads as the current month -
  // better than an error boundary on a bookmarked link.
  month: YearMonthKey.optional().catch(undefined),
});

// The pages a movement is started from: they carry the month to return to, and may name the
// bookmark the movement is started from. A stale or hand-edited bookmark id degrades to a blank
// form, for the same reason a bad month degrades to none.
export const newMovementSearchSchema = movementsSearchSchema.extend({
  bookmarkId: z.uuidv4().optional().catch(undefined),
});

export const Route = createFileRoute('/movements')({
  component: Movements,
  validateSearch: movementsSearchSchema,
});
