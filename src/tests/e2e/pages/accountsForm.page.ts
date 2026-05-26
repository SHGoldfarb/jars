import { type Page } from '@playwright/test';

export const accountFormPageConstructor = (page: Page) => {
  const gotoCreate = () => page.goto('/accounts/new');
  const submitButton = page.getByRole('button', { name: 'Submit' });
  const deleteButton = page.getByRole('button', { name: 'Delete' });
  const nameInput = page.getByLabel('Name');

  return { gotoCreate, submitButton, deleteButton, nameInput };
};

export type AccountFormPage = ReturnType<typeof accountFormPageConstructor>;
