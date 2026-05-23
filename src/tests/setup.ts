import { test as base, expect } from '@playwright/test';
import { accountsPageConstructor, type AccountsPage } from './pages/accounts.page';
import { accountFormPageConstructor, type AccountFormPage } from './pages/accountsForm.page';

const test = base.extend<{
  accountsPage: AccountsPage;
  accountFormPage: AccountFormPage;
  createAccount: (accountName: string) => Promise<void>;
}>({
  accountsPage: async ({ page }, use) => {
    await use(accountsPageConstructor(page));
  },
  accountFormPage: async ({ page }, use) => {
    await use(accountFormPageConstructor(page));
  },
  createAccount: async ({ accountsPage, accountFormPage }, use) => {
    await use(async (accountName: string) => {
      await accountsPage.goto();
      await accountsPage.createAccountButton.click();
      await accountFormPage.nameInput.fill(accountName);
      await accountFormPage.submitButton.click();
      // Should be redirected to the accounts page
      await expect(accountsPage.createAccountButton).toBeVisible();
      // Contains the new account
      await accountsPage.expectAccountToExist(accountName);
    });
  },
});

export { test };
