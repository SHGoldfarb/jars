import { expect } from '@playwright/test';
import { test } from './setup';

test('can create a subcategory', async ({ categoriesPage, categoryFormPage, createCategory }) => {
  await createCategory('Expense', 'Groceries');

  await categoriesPage.expensesTabButton.click();
  await categoriesPage.clickCategory('Groceries');
  await categoryFormPage.addSubcategoryButton.click();
  await categoryFormPage.nameInput.fill('Fruit');
  await categoryFormPage.submitButton.click();

  // Back on the list, nested under the category it belongs to.
  await expect(categoriesPage.expensesTabButton).toBeVisible();
  await categoriesPage.expectRowsInOrder('Expense', ['Groceries', 'Fruit']);
});

test('can edit a subcategory', async ({
  categoriesPage,
  categoryFormPage,
  createCategory,
  createSubcategory,
}) => {
  await createCategory('Expense', 'Groceries');
  await createSubcategory('Expense', 'Groceries', 'Fruti');

  await categoriesPage.expensesTabButton.click();
  await categoriesPage.clickSubcategory('Fruti');

  await expect(categoryFormPage.nameInput).toHaveValue('Fruti');
  await categoryFormPage.nameInput.fill('Fruit');
  await categoryFormPage.submitButton.click();

  await expect(categoriesPage.expensesTabButton).toBeVisible();
  await categoriesPage.expectSubcategoryToExist('Fruit');
  await categoriesPage.expectSubcategoryToNotExist('Fruti');
});

test('can delete a subcategory', async ({
  categoriesPage,
  categoryFormPage,
  createCategory,
  createSubcategory,
}) => {
  await createCategory('Expense', 'Groceries');
  await createSubcategory('Expense', 'Groceries', 'Fruit');

  await categoriesPage.expensesTabButton.click();
  await categoriesPage.clickSubcategory('Fruit');
  await categoryFormPage.deleteButton.click();

  await expect(categoriesPage.expensesTabButton).toBeVisible();
  await categoriesPage.expectSubcategoryToNotExist('Fruit');
  // The category it hung off is untouched.
  await categoriesPage.expectCategoryToExist('Groceries');
});

test('subcategories are listed under their parent, alphabetically', async ({
  categoriesPage,
  createCategory,
  createSubcategory,
}) => {
  test.slow();
  // Created out of alphabetical order, so the order shown cannot be the creation order.
  await createCategory('Expense', 'Transport');
  await createCategory('Expense', 'Groceries');
  await createCategory('Income', 'Salary');
  await createSubcategory('Expense', 'Groceries', 'Meat');
  await createSubcategory('Expense', 'Groceries', 'Bread');
  await createSubcategory('Expense', 'Transport', 'Taxi');
  await createSubcategory('Expense', 'Transport', 'Bus');

  // Only under its own category, and only in the kind that category lives in.
  await categoriesPage.expensesTabButton.click();
  await categoriesPage.expectRowsInOrder('Expense', [
    'Groceries',
    'Bread',
    'Meat',
    'Transport',
    'Bus',
    'Taxi',
  ]);

  await categoriesPage.incomeTabButton.click();
  await categoriesPage.expectRowsInOrder('Income', ['Salary']);
});

test('deleting a category takes its subcategories with it', async ({
  categoriesPage,
  categoryFormPage,
  createCategory,
  createSubcategory,
}) => {
  test.slow();
  await createCategory('Expense', 'Groceries');
  await createCategory('Expense', 'Transport');
  await createSubcategory('Expense', 'Groceries', 'Fruit');
  await createSubcategory('Expense', 'Transport', 'Bus');

  await categoriesPage.expensesTabButton.click();
  await categoriesPage.clickCategory('Groceries');
  await categoryFormPage.deleteButton.click();

  await expect(categoriesPage.expensesTabButton).toBeVisible();
  // The deleted category's subcategory is gone with it; the other category keeps its own.
  await categoriesPage.expectRowsInOrder('Expense', ['Transport', 'Bus']);
});
