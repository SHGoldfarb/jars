import { type Page } from '@playwright/test';

export const categoryFormPageConstructor = (page: Page) => {
  const submitButton = page.getByRole('button', { name: 'Submit' });
  const deleteButton = page.getByRole('button', { name: 'Delete' });
  const nameInput = page.getByLabel('Name');

  return { submitButton, deleteButton, nameInput };
};

export type CategoryFormPage = ReturnType<typeof categoryFormPageConstructor>;
