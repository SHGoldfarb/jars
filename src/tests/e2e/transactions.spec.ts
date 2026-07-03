import { expect } from '@playwright/test';
import { defaultData, test } from './setup';
import { runInOrder } from 'src/lib/utils';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { decimal } from 'src/services/finance';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';

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
  const description = 'Payment for May';
  const amount = '1200000';
  const date = '2026-05-20T15:20';

  await createAccount(accountName);
  await createJar(jarName);
  await createCategory('Income', categoryName);

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransactionButton.click();

  await transactionFormPage.fillAmount(amount);
  await transactionFormPage.fillDate(date);
  await transactionFormPage.fillDescription(description);
  await transactionFormPage.selectType('Income');
  await transactionFormPage.selectAccount(accountName);
  await transactionFormPage.selectJar(jarName);
  await transactionFormPage.selectCategory(categoryName);
  await transactionFormPage.submitButton.click();

  await expect(movementsPage.createTransactionButton).toBeVisible();
  const transactionLink = movementsPage.getTransaction(description);
  await expect(transactionLink).toBeVisible();
  await expect(transactionLink.getByText(categoryName)).toBeVisible();
  await expect(transactionLink.getByText(jarName)).toBeVisible();
  await expect(transactionLink.getByText(accountName)).toBeVisible();
  await expect(
    transactionLink.getByText(
      formatCurrencyAmount({ currency: 'CLP', amountDecimal: decimal.parseString(amount) })
    )
  ).toBeVisible();
  await expect(
    transactionLink.getByText(formatDateISO(new Date(`${date}:00.000Z`).toISOString()))
  ).toBeVisible();
});

test('can edit transaction', async ({
  createAccount,
  createJar,
  createCategory,
  createTransaction,
  movementsPage,
  transactionFormPage,
}) => {
  test.slow();
  // Initial data
  const initialAccountName = 'Initial checking';
  const initialJarName = 'Initial savings';
  const initialCategoryName = 'Part-time job';
  const initialDescription = 'Freelance project';
  const initialAmount = '500000';
  const initialDate = '2026-06-15T10:00';

  // New data (every field will change)
  const newAccountName = 'New checking';
  const newJarName = 'New savings';
  const newCategoryName = 'Utilities';
  const newDescription = 'Electric bill';
  const newAmount = '75000';
  const newDate = '2026-06-20T14:30';

  // Setup all entities
  await createAccount(initialAccountName);
  await createJar(initialJarName);
  await createCategory('Income', initialCategoryName);
  await createAccount(newAccountName);
  await createJar(newJarName);
  await createCategory('Expense', newCategoryName);

  // Create initial transaction
  await createTransaction({
    amount: initialAmount,
    date: initialDate,
    description: initialDescription,
    type: 'Income',
    accountName: initialAccountName,
    jarName: initialJarName,
    categoryName: initialCategoryName,
  });

  // Verify the initial transaction exists
  await expect(movementsPage.createTransactionButton).toBeVisible();
  await expect(movementsPage.getTransaction(initialDescription)).toBeVisible();

  // Open the edit form by clicking the transaction link
  await movementsPage.getTransaction(initialDescription).click();

  // Change every field of the transaction
  await transactionFormPage.fillAmount(newAmount);
  await transactionFormPage.fillDate(newDate);
  await transactionFormPage.fillDescription(newDescription);
  await transactionFormPage.selectType('Expense');
  await transactionFormPage.selectAccount(newAccountName);
  await transactionFormPage.selectJar(newJarName);
  await transactionFormPage.selectCategory(newCategoryName);
  await transactionFormPage.submitButton.click();

  // Verify the transaction now shows the new values on movements page
  await expect(movementsPage.createTransactionButton).toBeVisible();
  const transactionLink = movementsPage.getTransaction(newDescription);
  await expect(transactionLink).toBeVisible();
  await expect(transactionLink.getByText(newCategoryName)).toBeVisible();
  await expect(transactionLink.getByText(newJarName)).toBeVisible();
  await expect(transactionLink.getByText(newAccountName)).toBeVisible();
  await expect(
    transactionLink.getByText(
      formatCurrencyAmount({ currency: 'CLP', amountDecimal: decimal.parseString(newAmount) })
    )
  ).toBeVisible();
  await expect(
    transactionLink.getByText(formatDateISO(new Date(`${newDate}:00.000Z`).toISOString()))
  ).toBeVisible();
});

test('can delete transaction', async ({
  createDefaultData,
  createTransaction,
  movementsPage,
  page,
}) => {
  const description = 'Invoice for June';
  const amount = '250000';
  const date = '2026-06-30T09:00';

  await createDefaultData();

  await createTransaction({
    amount,
    date,
    description,
    type: 'Income',
    accountName: defaultData.accounts[0],
    jarName: defaultData.jars[0],
    categoryName: defaultData.incomeCategories[0],
  });

  // Verify the transaction exists
  await expect(movementsPage.createTransactionButton).toBeVisible();
  await expect(movementsPage.getTransaction(description)).toBeVisible();

  // Open the edit form by clicking the transaction link
  await movementsPage.getTransaction(description).click();

  // Delete the transaction
  await page.getByRole('button', { name: 'Delete' }).click();

  // Verify the transaction no longer exists on the movements page
  await expect(movementsPage.createTransactionButton).toBeVisible();
  await expect(movementsPage.getTransaction(description)).not.toBeVisible();
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
    test.slow();
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

  test('form loads existing transaction into fields', async () => {
    // WIP
  });
});
