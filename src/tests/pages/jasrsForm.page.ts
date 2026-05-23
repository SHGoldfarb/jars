import { type Page } from '@playwright/test';

export const jarFormPageConstructor = (page: Page) => {
  const gotoCreate = () => page.goto('/jars/new');
  const submitButton = page.getByRole('button', { name: 'Submit' });
  const deleteButton = page.getByRole('button', { name: 'Delete' });
  const nameInput = page.getByLabel('Name');

  return { gotoCreate, submitButton, deleteButton, nameInput };
};

export type JarFormPage = ReturnType<typeof jarFormPageConstructor>;
