import { type Page } from '@playwright/test';

export const categoryFormPageConstructor = (page: Page) => {
  const gotoCreateIncome = () => page.goto('/categories/income/new');
  const gotoCreateExpense = () => page.goto('/categories/expense/new');
  const submitButton = page.getByRole('button', { name: 'Submit' });
  const deleteButton = page.getByRole('button', { name: 'Delete' });
  const nameInput = page.getByLabel('Name');

  return { gotoCreateIncome, gotoCreateExpense, submitButton, deleteButton, nameInput };
};

export type CategoryFormPage = ReturnType<typeof categoryFormPageConstructor>;
