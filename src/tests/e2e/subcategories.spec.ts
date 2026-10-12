import { expect } from '@playwright/test';
import { test } from './setup';

test('can create a subcategory', async ({
  rootLayoutPage,
  categoriesPage,
  categoryFormPage,
  seedData,
}) => {
  await seedData({ expenseCategories: ['Groceries'] });

  await rootLayoutPage.navButton('Categories').click();
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
  rootLayoutPage,
  categoriesPage,
  categoryFormPage,
  seedData,
}) => {
  await seedData({
    expenseCategories: ['Groceries'],
    subcategories: [{ categoryName: 'Groceries', name: 'Fruti' }],
  });

  await rootLayoutPage.navButton('Categories').click();
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
  rootLayoutPage,
  categoriesPage,
  categoryFormPage,
  seedData,
}) => {
  await seedData({
    expenseCategories: ['Groceries'],
    subcategories: [{ categoryName: 'Groceries', name: 'Fruit' }],
  });

  await rootLayoutPage.navButton('Categories').click();
  await categoriesPage.expensesTabButton.click();
  await categoriesPage.clickSubcategory('Fruit');
  await categoryFormPage.deleteButton.click();

  await expect(categoriesPage.expensesTabButton).toBeVisible();
  await categoriesPage.expectSubcategoryToNotExist('Fruit');
  // The category it hung off is untouched.
  await categoriesPage.expectCategoryToExist('Groceries');
});

test('subcategories are listed under their parent, alphabetically', async ({
  rootLayoutPage,
  categoriesPage,
  seedData,
}) => {
  // Seeded out of alphabetical order, so the order shown cannot be the seeded order.
  await seedData({
    incomeCategories: ['Salary'],
    expenseCategories: ['Transport', 'Groceries'],
    subcategories: [
      { categoryName: 'Groceries', name: 'Meat' },
      { categoryName: 'Groceries', name: 'Bread' },
      { categoryName: 'Transport', name: 'Taxi' },
      { categoryName: 'Transport', name: 'Bus' },
    ],
  });

  // Only under its own category, and only in the kind that category lives in.
  await rootLayoutPage.navButton('Categories').click();
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
  rootLayoutPage,
  categoriesPage,
  categoryFormPage,
  seedData,
}) => {
  await seedData({
    expenseCategories: ['Groceries', 'Transport'],
    subcategories: [
      { categoryName: 'Groceries', name: 'Fruit' },
      { categoryName: 'Transport', name: 'Bus' },
    ],
  });

  await rootLayoutPage.navButton('Categories').click();
  await categoriesPage.expensesTabButton.click();
  await categoriesPage.clickCategory('Groceries');
  await categoryFormPage.deleteButton.click();

  await expect(categoriesPage.expensesTabButton).toBeVisible();
  // The deleted category's subcategory is gone with it; the other category keeps its own.
  await categoriesPage.expectRowsInOrder('Expense', ['Transport', 'Bus']);
});
