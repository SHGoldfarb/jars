import { expect, type Page } from '@playwright/test';

export const bookmarksPageConstructor = (page: Page) => {
  // Outside edit mode every bookmark is a link to the form it starts.
  const getBookmark = (description: string) =>
    page.getByRole('link', { name: new RegExp(description, 'i') });
  const editButton = page.getByRole('button', { name: 'Edit', exact: true });
  const doneButton = page.getByRole('button', { name: 'Done', exact: true });
  const deleteButton = (description: string) =>
    page.getByRole('button', { name: `Delete bookmark ${description}`, exact: true });
  const emptyMessage = page.getByText(
    'No bookmarks yet — open a movement and choose Save as bookmark'
  );

  // Exactly these bookmarks, in this order: newest first.
  const expectBookmarksInOrder = async (descriptions: string[]) => {
    await expect(
      page.getByRole('link').filter({ hasText: new RegExp(descriptions.join('|')) })
    ).toHaveText(descriptions.map((description) => new RegExp(description)));
  };

  return {
    getBookmark,
    editButton,
    doneButton,
    deleteButton,
    emptyMessage,
    expectBookmarksInOrder,
  };
};

export type BookmarksPage = ReturnType<typeof bookmarksPageConstructor>;
