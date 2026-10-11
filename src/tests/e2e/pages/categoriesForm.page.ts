import { type Page } from '@playwright/test';

export const categoryFormPageConstructor = (page: Page) => {
  const submitButton = page.getByRole('button', { name: 'Submit' });
  const deleteButton = page.getByRole('button', { name: 'Delete' });
  const nameInput = page.getByLabel('Name');
  // Only on a category's edit screen: a subcategory is created from the category it belongs to.
  const addSubcategoryButton = page.getByRole('link', { name: 'Add subcategory' });

  return { submitButton, deleteButton, nameInput, addSubcategoryButton };
};

export type CategoryFormPage = ReturnType<typeof categoryFormPageConstructor>;
