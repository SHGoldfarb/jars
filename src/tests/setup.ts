import { test as base, expect } from '@playwright/test';
import { accountsPageConstructor, type AccountsPage } from './pages/accounts.page';
import { accountFormPageConstructor, type AccountFormPage } from './pages/accountsForm.page';
import { jarsPageConstructor, type JarsPage } from './pages/jars.page';
import { jarFormPageConstructor, type JarFormPage } from './pages/jasrsForm.page';

const test = base.extend<{
  accountsPage: AccountsPage;
  accountFormPage: AccountFormPage;
  jarsPage: JarsPage;
  jarFormPage: JarFormPage;
  createAccount: (accountName: string) => Promise<void>;
  createJar: (jarName: string) => Promise<void>;
}>({
  accountsPage: async ({ page }, use) => {
    await use(accountsPageConstructor(page));
  },
  accountFormPage: async ({ page }, use) => {
    await use(accountFormPageConstructor(page));
  },
  jarsPage: async ({ page }, use) => {
    await use(jarsPageConstructor(page));
  },
  jarFormPage: async ({ page }, use) => {
    await use(jarFormPageConstructor(page));
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
  createJar: async ({ jarsPage, jarFormPage }, use) => {
    await use(async (jarName: string) => {
      await jarsPage.goto();
      await jarsPage.createJarButton.click();
      await jarFormPage.nameInput.fill(jarName);
      await jarFormPage.submitButton.click();
      // Should be redirected to the jars page
      await expect(jarsPage.createJarButton).toBeVisible();
      // Contains the new jar
      await jarsPage.expectJarToExist(jarName);
    });
  },
});

export { test };
