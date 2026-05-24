import { expect } from '@playwright/test';
import { test } from './setup';
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
