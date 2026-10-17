import { createFileRoute } from '@tanstack/react-router';
import { movementsSearchSchema } from 'src/routes/movements';
import { Bookmarks } from 'src/components/Bookmarks';

export const Route = createFileRoute('/bookmarks')({
  component: Bookmarks,
  // Carries the month the user was browsing through to the form a bookmark opens, so cancelling
  // that form still returns to it.
  validateSearch: movementsSearchSchema,
});
