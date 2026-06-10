import { expect } from '@playwright/test';
import { defaultData, test } from './setup';
import { runInOrder } from 'src/lib/utils';

test('can create income transaction', async ({
  createAccount,
  createJar,
  createCategory,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
}) => {
  const accountName = 'Main account for income';
  const jarName = 'Main jar for income';
  const categoryName = 'Salary';
  const description = 'Salary payment for May';

  await createAccount(accountName);
  await createJar(jarName);
  await createCategory('Income', categoryName);

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransactionButton.click();

  await transactionFormPage.amountInput.fill('1200000');
  await transactionFormPage.dateInput.fill('2026-05-20');
  await transactionFormPage.descriptionInput.fill(description);
  await transactionFormPage.selectType('Income');
  await transactionFormPage.selectAccount(accountName);
  await transactionFormPage.selectJar(jarName);
  await transactionFormPage.selectCategory(categoryName);
  await transactionFormPage.submitButton.click();

  await expect(movementsPage.createTransactionButton).toBeVisible();
  await movementsPage.expectTransactionToExist(description);
});

test.describe('transaction form', () => {
  test('selectors behavior', async ({
    createAccount,
    createJar,
    createCategory,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
    deleteAccount,
    deleteJar,
    deleteCategory,
  }) => {
    // Setup data
    const accountName = 'Main account for expense';
    const jarName = 'Main jar for expense';
    const incomeCategoryName = 'Dividends';
    const expenseCategoryName = 'Groceries';
    await createAccount(accountName);
    await createJar(jarName);
    await createCategory('Income', incomeCategoryName);
    await createCategory('Expense', expenseCategoryName);

    // Setup deleted data
    const deletedCategoryName = 'Deleted Category';
    const deletedAccountName = 'Deleted Account';
    const deletedJarName = 'Deleted Jar';
    await createAccount(deletedAccountName);
    await createCategory('Expense', deletedCategoryName);
    await createJar(deletedJarName);
    await deleteAccount(deletedAccountName);
    await deleteCategory('Expense', deletedCategoryName);
    await deleteJar(deletedJarName);

    // Go to form
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();

    // Categories selector only shows selected kind categories
    await transactionFormPage.selectType('Income');
    await transactionFormPage.expectCategoryOptionToExist(incomeCategoryName);
    await transactionFormPage.expectCategoryOptionToNotExist(expenseCategoryName);

    await transactionFormPage.selectType('Expense');
    await transactionFormPage.expectCategoryOptionToExist(expenseCategoryName);
    await transactionFormPage.expectCategoryOptionToNotExist(incomeCategoryName);

    // Selectors dont show deleted data
    await transactionFormPage.selectType('Expense');
    await transactionFormPage.expectOptionToNotExist('Category', deletedCategoryName);
    await transactionFormPage.expectOptionToNotExist('Account', deletedAccountName);
    await transactionFormPage.expectOptionToNotExist('Jar', deletedJarName);
  });

  test('form validations', async ({
    transactionFormPage,
    page,
    createDefaultData,
    rootLayoutPage,
    movementsPage,
  }) => {
    // Setup data
    await createDefaultData();

    // Go to form
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();

    // Validates required fields
    await transactionFormPage.submitButton.click();
    await runInOrder(
      ['Amount is required', 'Account is required', 'Category is required', 'Jar is required'].map(
        (errorMessage) => async () => {
          await expect(page.getByText(errorMessage)).toBeVisible();
        }
      )
    );

    // Validates amount is number
    await transactionFormPage.amountInput.fill('asdf');
    await transactionFormPage.selectAccount(defaultData.accounts[0]);
    await transactionFormPage.selectType('Income');
    await transactionFormPage.selectCategory(defaultData.incomeCategories[0]);
    await transactionFormPage.selectJar(defaultData.jars[0]);
    await transactionFormPage.submitButton.click();
    await expect(page.getByText('Amount must be a positive number')).toBeVisible();

    // Validates amount is positive
    await transactionFormPage.amountInput.fill('0');
    await transactionFormPage.submitButton.click();
    await expect(page.getByText('Amount must be greater than zero')).toBeVisible();
  });
});
