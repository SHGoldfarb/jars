import { expect } from '@playwright/test';
import { defaultData, test } from './setup';
import { runInOrder } from 'src/lib/utils';

test('can create account', async ({ rootLayoutPage, accountsPage, accountFormPage }) => {
  const accountName = 'Test Account';

  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.createAccountButton.click();
  await accountFormPage.nameInput.fill(accountName);
  await accountFormPage.submitButton.click();
  // Should be redirected to the accounts page
  await expect(accountsPage.createAccountButton).toBeVisible();

  // Contains the new account
  await accountsPage.expectAccountToExist(accountName);
});

test('shows accounts', async ({ accountsPage, createAccount }) => {
  const accountNames = ['Savings', 'Checking'];

  // Create accounts
  await runInOrder(accountNames.map((accountName) => () => createAccount(accountName)));

  // Test that they are visible
  await runInOrder(
    accountNames.map((accountName) => () => accountsPage.expectAccountToExist(accountName))
  );
});

test('can delete account', async ({ accountsPage, accountFormPage, createAccount }) => {
  const name = 'Account to delete';

  await createAccount(name);

  await accountsPage.clickAccount(name);
  await accountFormPage.deleteButton.click();

  // Should be redirected to the accounts page
  await expect(accountsPage.createAccountButton).toBeVisible();

  // Does not contain the account
  await accountsPage.expectAccountToNotExist(name);
});

test('can edit account', async ({ accountsPage, accountFormPage, createAccount }) => {
  const initialName = 'Account to be renamed';
  const newName = 'Renamed account';

  await createAccount(initialName);

  await accountsPage.clickAccount(initialName);

  // Name input should be pre-filled with the current name
  await expect(accountFormPage.nameInput).toHaveValue(initialName);

  // Fill and submit
  await accountFormPage.nameInput.fill(newName);
  await accountFormPage.submitButton.click();

  // Should be redirected to the accounts page
  await expect(accountsPage.createAccountButton).toBeVisible();

  // Contains the updated account and not the old one
  await accountsPage.expectAccountToExist(newName);
  await accountsPage.expectAccountToNotExist(initialName);
});

test('accounts show balance', async ({
  createDefaultData,
  createTransaction,
  deleteTransaction,
  createTransfer,
  deleteTransfer,
  rootLayoutPage,
  accountsPage,
  createAccount,
}) => {
  test.slow();
  const jarName = defaultData.jars[0];
  const expenseCategoryName = defaultData.expenseCategories[0];
  const incomeCategoryName = defaultData.incomeCategories[0];
  const accountName = defaultData.accounts[0];
  const date = '2026-06-30T09:00';
  const secondAccountName = 'Checking Account';
  const incomeTransactionAmount = 10000;
  const expenseTransactionAmount = 3000;
  const outgoingTransferAmount = 5000;
  const incomingTransferAmount = 2000;

  await createDefaultData();
  await createAccount(secondAccountName);
  // Income transaction should add to acocunt balance
  await createTransaction({
    amount: incomeTransactionAmount.toString(),
    date,
    description: 'income transaction',
    type: 'Income',
    accountName,
    jarName,
    categoryName: incomeCategoryName,
  });
  // Expense transaction should substract from account balance
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
  // Transaction belonging to another account shouldn't count
  await createTransaction({
    amount: '12345',
    date,
    description: 'different account',
    type: 'Expense',
    accountName: secondAccountName,
    jarName,
    categoryName: expenseCategoryName,
  });
  // A transfer out of the account should substract from its balance
  await createTransfer({
    amount: outgoingTransferAmount.toString(),
    date,
    description: 'outgoing transfer',
    originAccountName: accountName,
    destinationAccountName: secondAccountName,
  });
  // A transfer into the account should add to its balance
  await createTransfer({
    amount: incomingTransferAmount.toString(),
    date,
    description: 'incoming transfer',
    originAccountName: secondAccountName,
    destinationAccountName: accountName,
  });
  // Deleted transfer should not count
  const deletedTransferDescription = 'deleted transfer';
  await createTransfer({
    amount: '54321',
    date,
    description: deletedTransferDescription,
    originAccountName: secondAccountName,
    destinationAccountName: accountName,
  });
  await deleteTransfer(deletedTransferDescription);

  await rootLayoutPage.navButton('Accounts').click();

  // Expected string is hardcoded for the hardcoded amounts above:
  // 10000 income - 3000 expense - 5000 transferred out + 2000 transferred in -> CLP.
  await expect(accountsPage.getAccount(accountName)).toContainText('$4.000');
});

test('delete button is disabled for accounts with non zero balance', async ({
  createTransaction,
  createDefaultData,
  rootLayoutPage,
  accountsPage,
  accountFormPage,
}) => {
  test.slow();
  await createDefaultData();
  await createTransaction();
  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.clickAccount(defaultData.accounts[0]);
  await expect(accountFormPage.deleteButton).toBeDisabled();
});
