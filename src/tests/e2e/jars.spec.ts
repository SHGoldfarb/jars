import { expect } from '@playwright/test';
import { defaultData, test } from './setup';
import { runInOrder } from 'src/lib/utils';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { currency } from 'src/services/finance';

test('can create jar', async ({ rootLayoutPage, jarsPage, jarFormPage }) => {
  const jarName = 'Test Jar';

  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.createJarButton.click();
  await jarFormPage.nameInput.fill(jarName);
  await jarFormPage.submitButton.click();
  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Contains the new jar
  await jarsPage.expectJarToExist(jarName);
});

test('shows jars', async ({ jarsPage, createJar }) => {
  const jarNames = ['Holidays', 'Groceries'];

  // Create jars
  await runInOrder(jarNames.map((jarName) => () => createJar(jarName)));

  // Test that they are visible
  await runInOrder(jarNames.map((jarName) => () => jarsPage.expectJarToExist(jarName)));
});

test('can delete jar', async ({ jarsPage, jarFormPage, createJar }) => {
  const name = 'Jar to delete';

  await createJar(name);

  await jarsPage.clickJar(name);
  await jarFormPage.deleteButton.click();

  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Does not contain the jar
  await jarsPage.expectJarToNotExist(name);
});

test('can edit jar', async ({ jarsPage, jarFormPage, createJar }) => {
  const initialName = 'Jar to be renamed';
  const newName = 'Renamed jar';

  await createJar(initialName);

  await jarsPage.clickJar(initialName);

  // Name input should be pre-filled with the current name
  await expect(jarFormPage.nameInput).toHaveValue(initialName);

  // Fill and submit
  await jarFormPage.nameInput.fill(newName);
  await jarFormPage.submitButton.click();

  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Contains the updated jar and not the old one
  await jarsPage.expectJarToExist(newName);
  await jarsPage.expectJarToNotExist(initialName);
});

test('jars show balance', async ({
  createDefaultData,
  createTransaction,
  deleteTransaction,
  rootLayoutPage,
  jarsPage,
  createJar,
}) => {
  test.slow();
  const jarName = defaultData.jars[0];
  const expenseCategoryName = defaultData.expenseCategories[0];
  const incomeCategoryName = defaultData.incomeCategories[0];
  const accountName = defaultData.accounts[0];
  const date = '2026-06-30T09:00';
  const secondJarName = 'Savings Jar';
  const incomeTransactionAmount = 10000;
  const expenseTransactionAmount = 3000;

  await createDefaultData();
  await createJar(secondJarName);
  // Income transaction should add to jar balance
  await createTransaction({
    amount: incomeTransactionAmount.toString(),
    date,
    description: 'income transaction',
    type: 'Income',
    accountName,
    jarName,
    categoryName: incomeCategoryName,
  });
  // Expense transaction should substract from jar balance
  await createTransaction({
    amount: expenseTransactionAmount.toString(),
    date,
    description: 'expense transaction',
    type: 'Expense',
    accountName,
    jarName,
    categoryName: expenseCategoryName,
  });
  // Deleted transaction should not count
  const deletedTransactionDescription = 'deleted transaction';
  await createTransaction({
    amount: '12345',
    date,
    description: deletedTransactionDescription,
    type: 'Expense',
    accountName,
    jarName,
    categoryName: expenseCategoryName,
  });
  await deleteTransaction(deletedTransactionDescription);
  // Transaction belonging to another jar shouldn't count
  await createTransaction({
    amount: '12345',
    date,
    description: 'different jar',
    type: 'Expense',
    accountName,
    jarName: secondJarName,
    categoryName: expenseCategoryName,
  });

  await rootLayoutPage.navButton('Jars').click();

  await expect(jarsPage.getJar(jarName)).toContainText(
    formatCurrencyAmount(currency.new(incomeTransactionAmount - expenseTransactionAmount))
  );
});
