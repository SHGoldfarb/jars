import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useBookmarks = () => {
  const { data, isPending, refetch } = useQuery({
    queryKey: ['financeQueries.listBookmarks'],
    queryFn: () => financeQueries.bookmarks.list(),
  });

  // isPending separates "there are no bookmarks" from "the list has not arrived yet", so the
  // empty message does not flash on the way in. refetch is for a change made without leaving the
  // page - deleting a bookmark from the list itself.
  return { bookmarks: data ?? [], isPending, refetch };
};
