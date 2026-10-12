import { expect } from '@playwright/test';
import { defaultData, test } from './setup';

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

test('can delete account', async ({ rootLayoutPage, accountsPage, accountFormPage, seedData }) => {
  const name = 'Account to delete';

  await seedData({ accounts: [name] });

  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.clickAccount(name);
  await accountFormPage.deleteButton.click();

  // Should be redirected to the accounts page
  await expect(accountsPage.createAccountButton).toBeVisible();

  // Does not contain the account
  await accountsPage.expectAccountToNotExist(name);
});

test('can edit account', async ({ rootLayoutPage, accountsPage, accountFormPage, seedData }) => {
  const initialName = 'Account to be renamed';
  const newName = 'Renamed account';

  await seedData({ accounts: [initialName] });

  await rootLayoutPage.navButton('Accounts').click();
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

test('accounts show balance', async ({ seedData, rootLayoutPage, accountsPage }) => {
  const accountName = defaultData.accounts[0];
  const secondAccountName = 'Checking Account';

  await seedData({
    ...defaultData,
    accounts: [accountName, secondAccountName],
    transactions: [
      // Income transaction should add to account balance
      { amount: '10000', description: 'income transaction', type: 'Income', accountName },
      // Expense transaction should substract from account balance
      { amount: '3000', description: 'expense transaction', type: 'Expense', accountName },
      // Deleted transaction should not count
      {
        amount: '12345',
        description: 'deleted transaction',
        type: 'Expense',
        accountName,
        archived: true,
      },
      // Transaction belonging to another account shouldn't count
      {
        amount: '12345',
        description: 'different account',
        type: 'Expense',
        accountName: secondAccountName,
      },
    ],
    transfers: [
      // A transfer out of the account should substract from its balance
      {
        amount: '5000',
        description: 'outgoing transfer',
        originAccountName: accountName,
        destinationAccountName: secondAccountName,
      },
      // A transfer into the account should add to its balance
      {
        amount: '2000',
        description: 'incoming transfer',
        originAccountName: secondAccountName,
        destinationAccountName: accountName,
      },
      // Deleted transfer should not count
      {
        amount: '54321',
        description: 'deleted transfer',
        originAccountName: secondAccountName,
        destinationAccountName: accountName,
        archived: true,
      },
    ],
  });

  await rootLayoutPage.navButton('Accounts').click();

  // Expected string is hardcoded for the hardcoded amounts above:
  // 10000 income - 3000 expense - 5000 transferred out + 2000 transferred in -> CLP.
  await expect(accountsPage.getAccount(accountName)).toContainText('$4,000');
});

test('delete button is disabled for accounts with non zero balance', async ({
  seedData,
  rootLayoutPage,
  accountsPage,
  accountFormPage,
}) => {
  await seedData({
    ...defaultData,
    transactions: [{ description: 'Gives the account a balance' }],
  });
  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.clickAccount(defaultData.accounts[0]);
  await expect(accountFormPage.deleteButton).toBeDisabled();
});

test('shows accounts, listed alphabetically', async ({
  rootLayoutPage,
  accountsPage,
  seedData,
}) => {
  // Seeded out of alphabetical order, so the order shown cannot be the seeded order.
  await seedData({ accounts: ['Wallet', 'Bank', 'Mattress'] });

  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.expectAccountsInOrder(['Bank', 'Mattress', 'Wallet']);
});
