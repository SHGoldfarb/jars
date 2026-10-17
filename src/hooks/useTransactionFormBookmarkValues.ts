import { useQuery } from '@tanstack/react-query';
import { transactionForm } from 'src/services/transaction-form';

// The values a new transaction started from a bookmark opens with. `ready` holds off until they
// have been read on this visit: the form takes its values once, on mount, so a copy cached from
// an earlier visit - before a jar was deleted, say - must not be what it mounts with.
export const useTransactionFormBookmarkValues = (bookmarkId: string | undefined) => {
  const { data, isFetchedAfterMount } = useQuery({
    queryKey: ['transactionFormQueries.getFormValuesFromBookmark', bookmarkId],
    // A query cannot resolve to undefined, so "no such bookmark" travels as null.
    queryFn: async () =>
      bookmarkId
        ? ((await transactionForm.queries.getFormValuesFromBookmark(bookmarkId)) ?? null)
        : null,
    enabled: !!bookmarkId,
  });

  return {
    values: data ?? undefined,
    ready: !bookmarkId || isFetchedAfterMount,
  };
};
