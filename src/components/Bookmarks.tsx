import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { financeCommands, type Bookmark } from 'src/services/finance';
import { useBookmarks } from 'src/hooks/useBookmarks';
import { BookmarkListItem } from './BookmarkListItem';
import { GenericList } from './GenericList';
import { Button } from './ui/button';
import { ItemActions } from './ui/item';

// A bookmark opens the form of its own kind of movement, which starts from it.
const bookmarkUrl = (bookmark: Bookmark) => {
  if (bookmark.movementType === 'transaction') {
    return '/transactions/new';
  }
  if (bookmark.movementType === 'transfer') {
    return '/transfers/new';
  }
  return '/allocations/new';
};

export const Bookmarks = () => {
  const { month } = useSearch({ from: '/bookmarks' });
  const { bookmarks, isPending, refetch } = useBookmarks();
  // In edit mode the rows stop being links, since a Delete button cannot sit inside one.
  const [editing, setEditing] = useState(false);

  const handleDelete = async (bookmarkId: string) => {
    try {
      await financeCommands.bookmarks.archive({ bookmarkId });
      await refetch();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  return (
    <>
      <GenericList
        items={bookmarks.map((bookmark) =>
          editing
            ? bookmark
            : {
                ...bookmark,
                url: bookmarkUrl(bookmark),
                search: { month, bookmarkId: bookmark.id },
              }
        )}
        actions={
          bookmarks.length > 0
            ? [
                {
                  label: editing ? 'Done' : 'Edit',
                  onClick: () => {
                    setEditing(!editing);
                  },
                },
              ]
            : []
        }
      >
        {(bookmark) => (
          <>
            <BookmarkListItem bookmark={bookmark} />
            {editing ? (
              <ItemActions>
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  aria-label={`Delete bookmark ${bookmark.description}`.trim()}
                  onClick={() => {
                    void handleDelete(bookmark.id);
                  }}
                >
                  Delete
                </Button>
              </ItemActions>
            ) : null}
          </>
        )}
      </GenericList>
      {bookmarks.length === 0 && !isPending ? (
        <p className="max-w-lg mx-auto py-3 text-center text-muted-foreground text-xs/relaxed">
          No bookmarks yet — open a movement and choose Save as bookmark
        </p>
      ) : null}
    </>
  );
};
