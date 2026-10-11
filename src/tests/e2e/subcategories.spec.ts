import { expect } from '@playwright/test';
import { defaultData, test } from './setup';

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

test('a subcategory is listed under its parent', async ({
  categoriesPage,
  createCategory,
  createSubcategory,
}) => {
  test.slow();
  await createCategory('Expense', 'Groceries');
  await createCategory('Expense', 'Transport');
  await createCategory('Income', 'Salary');
  await createSubcategory('Expense', 'Groceries', 'Fruit');

  // Only under its own category, and only in the kind that category lives in.
  await categoriesPage.expensesTabButton.click();
  await categoriesPage.expectRowsInOrder('Expense', ['Groceries', 'Fruit', 'Transport']);

  await categoriesPage.incomeTabButton.click();
  await categoriesPage.expectSubcategoryToNotExist('Fruit');
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

test('subcategories are listed alphabetically within their category', async ({
  categoriesPage,
  createCategory,
  createSubcategory,
}) => {
  test.slow();
  // Created out of alphabetical order, so the order shown cannot be the creation order.
  await createCategory('Expense', 'Transport');
  await createCategory('Expense', 'Groceries');
  await createSubcategory('Expense', 'Groceries', 'Meat');
  await createSubcategory('Expense', 'Groceries', 'Bread');
  await createSubcategory('Expense', 'Transport', 'Taxi');
  await createSubcategory('Expense', 'Transport', 'Bus');

  await categoriesPage.expensesTabButton.click();
  await categoriesPage.expectRowsInOrder('Expense', [
    'Groceries',
    'Bread',
    'Meat',
    'Transport',
    'Bus',
    'Taxi',
  ]);
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

// TODO: maybe this should be part of the transaction form behavior's tests
test.describe('on the transaction form', () => {
  test('the subcategory selector offers only the selected category subcategories', async ({
    createDefaultData,
    createSubcategory,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createSubcategory('Expense', 'Groceries', 'Meat');
    await createSubcategory('Expense', 'Groceries', 'Bread');
    await createSubcategory('Income', 'Salary', 'Bonus');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.selectType('Expense');
    await transactionFormPage.selectCategory('Groceries');

    // Alphabetical, and nothing belonging to another category.
    await transactionFormPage.expectOptionsInOrder('Subcategory', ['Bread', 'Meat']);
    await transactionFormPage.expectOptionToNotExist('Subcategory', 'Bonus');
  });

  test('the subcategory selector is empty until a category is selected', async ({
    createDefaultData,
    createSubcategory,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    await createDefaultData();
    await createSubcategory('Expense', 'Groceries', 'Meat');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.selectType('Expense');

    await transactionFormPage.expectOptionsInOrder('Subcategory', []);
  });

  test('the subcategory resets when the category changes', async ({
    createDefaultData,
    createCategory,
    createSubcategory,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createCategory('Expense', 'Transport');
    await createSubcategory('Expense', 'Groceries', 'Meat');
    await createSubcategory('Expense', 'Transport', 'Bus');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.selectType('Expense');
    await transactionFormPage.selectCategory('Groceries');
    await transactionFormPage.selectSubcategory('Meat');
    await transactionFormPage.expectSelection('Subcategory', 'Meat');

    await transactionFormPage.selectCategory('Transport');

    // Emptied, and now offering the new category's own.
    await transactionFormPage.expectSelection('Subcategory', 'Select Subcategory');
    await transactionFormPage.expectOptionsInOrder('Subcategory', ['Bus']);
  });

  test('picking a category opens its subcategories, and the form flows on from them', async ({
    page,
    createDefaultData,
    createSubcategory,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createSubcategory('Expense', 'Groceries', 'Meat');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.selectType('Expense');
    await transactionFormPage.selectCategory('Groceries');

    // The category has subcategories, so they are what opens next, not Account.
    await expect(page.getByRole('option', { name: 'Meat', exact: true })).toBeVisible();

    // Picking one leads on to the account.
    await page.getByRole('option', { name: 'Meat', exact: true }).click();
    await expect(page.getByRole('option', { name: defaultData.accounts[0] })).toBeVisible();
  });

  test('a skipped subcategory hands on to the account', async ({
    page,
    createDefaultData,
    createSubcategory,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createSubcategory('Expense', 'Groceries', 'Meat');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.selectType('Expense');
    await transactionFormPage.selectCategory('Groceries');
    await expect(page.getByRole('option', { name: 'Meat', exact: true })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('option', { name: defaultData.accounts[0] })).toBeVisible();
  });

  test('a category without subcategories goes straight on to the account', async ({
    page,
    createDefaultData,
    createCategory,
    createSubcategory,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createCategory('Expense', 'Transport');
    await createSubcategory('Expense', 'Groceries', 'Meat');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.selectType('Expense');
    await transactionFormPage.selectCategory('Transport');

    await expect(page.getByRole('option', { name: defaultData.accounts[0] })).toBeVisible();
  });

  test('a transaction can be saved with a category and no subcategory', async ({
    createDefaultData,
    createSubcategory,
    createTransaction,
    movementsPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createSubcategory('Expense', 'Groceries', 'Meat');

    await createTransaction({ description: 'No subcategory', categoryName: 'Groceries' });

    const transaction = movementsPage.getMovement('No subcategory');
    await expect(transaction).toBeVisible();
    await expect(transaction.getByText('Groceries')).toBeVisible();
    await expect(transaction.getByText('Meat')).toHaveCount(0);
  });

  test('a saved subcategory is shown with the category and survives a refresh', async ({
    page,
    createDefaultData,
    createSubcategory,
    createTransaction,
    movementsPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createSubcategory('Expense', 'Groceries', 'Meat');

    await createTransaction({
      description: 'With a subcategory',
      categoryName: 'Groceries',
      subcategoryName: 'Meat',
    });

    const transaction = movementsPage.getMovement('With a subcategory');
    await expect(transaction.getByText('Groceries · Meat')).toBeVisible();

    await page.reload();

    await expect(
      movementsPage.getMovement('With a subcategory').getByText('Groceries · Meat')
    ).toBeVisible();
  });

  test('a transaction subcategory can be changed by editing it', async ({
    createDefaultData,
    createSubcategory,
    createTransaction,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();
    await createDefaultData();
    await createSubcategory('Expense', 'Groceries', 'Meat');
    await createSubcategory('Expense', 'Groceries', 'Bread');

    await createTransaction({
      description: 'Changing subcategory',
      categoryName: 'Groceries',
      subcategoryName: 'Meat',
    });

    await movementsPage.getMovement('Changing subcategory').click();
    // The form opens on what was saved.
    await transactionFormPage.expectSelection('Subcategory', 'Meat');
    await transactionFormPage.selectSubcategory('Bread');
    await transactionFormPage.submitButton.click();

    await expect(
      movementsPage.getMovement('Changing subcategory').getByText('Groceries · Bread')
    ).toBeVisible();
  });
});
