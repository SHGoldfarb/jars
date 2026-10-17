import { useQuery } from '@tanstack/react-query';
import type { MovementFormUi } from 'src/services/movement-form';

// The values a new movement started from a bookmark opens with. `ready` holds off until they
// have been read on this visit: the form takes its values once, on mount, so a copy cached from
// an earlier visit - before an account was deleted, say - must not be what it mounts with.
export const useMovementFormBookmarkValues = (
  movementForm: MovementFormUi,
  bookmarkId: string | undefined
) => {
  const { data, isFetchedAfterMount } = useQuery({
    queryKey: [
      'movementFormQueries.getFormValuesFromBookmark',
      movementForm.endpointNoun.plural,
      bookmarkId,
    ],
    // A query cannot resolve to undefined, so "no such bookmark" travels as null.
    queryFn: async () =>
      bookmarkId
        ? ((await movementForm.queries.getFormValuesFromBookmark(bookmarkId)) ?? null)
        : null,
    enabled: !!bookmarkId,
  });

  return {
    values: data ?? undefined,
    ready: !bookmarkId || isFetchedAfterMount,
  };
};
