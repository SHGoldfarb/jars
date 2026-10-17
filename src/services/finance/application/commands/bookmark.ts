import { generateId } from 'src/lib/utils';
import { financeDomainCommands, type BookmarkUnsaved } from '../../domain';
import type { FinanceRepositories } from '../../domain';

export const createBookmarkCommands = (deps: FinanceRepositories) => ({
  create: async (input: BookmarkUnsaved) => {
    const bookmark = financeDomainCommands.bookmarks.create({
      ...input,
      id: generateId(),
      createdAtISO: new Date().toISOString(),
    });
    return deps.bookmarks.save(bookmark);
  },

  archive: async ({ bookmarkId }: { bookmarkId: string }) => {
    const current = await deps.bookmarks.getById(bookmarkId);
    return deps.bookmarks.save(financeDomainCommands.bookmarks.archive(current));
  },
});
