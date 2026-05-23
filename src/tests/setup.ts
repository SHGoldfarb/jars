import { test as base, expect } from '@playwright/test';
import { accountsPageConstructor, type AccountsPage } from './pages/accounts.page';
import { accountFormPageConstructor, type AccountFormPage } from './pages/accountsForm.page';
import { jarsPageConstructor, type JarsPage } from './pages/jars.page';
import { jarFormPageConstructor, type JarFormPage } from './pages/jarsForm.page';
import { categoriesPageConstructor, type CategoriesPage } from './pages/categories.page';
import { categoryFormPageConstructor, type CategoryFormPage } from './pages/categoriesForm.page';
import { rootLayoutPageConstructor, type RootLayoutPage } from './pages/rootLayout.page';

const test = base.extend<{
  accountsPage: AccountsPage;
  accountFormPage: AccountFormPage;
  jarsPage: JarsPage;
  jarFormPage: JarFormPage;
  createAccount: (accountName: string) => Promise<void>;
  createJar: (jarName: string) => Promise<void>;
  categoriesPage: CategoriesPage;
  categoryFormPage: CategoryFormPage;
  createCategory: (kind: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  rootLayoutPage: RootLayoutPage;
}>({
  rootLayoutPage: async ({ page }, use) => {
    await page.goto('/');
    await use(rootLayoutPageConstructor(page));
  },
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
  createAccount: async ({ accountsPage, accountFormPage, rootLayoutPage }, use) => {
    await use(async (accountName: string) => {
      await rootLayoutPage.navButton('Accounts').click();
      await accountsPage.createAccountButton.click();
      await accountFormPage.nameInput.fill(accountName);
      await accountFormPage.submitButton.click();
      // Should be redirected to the accounts page
      await expect(accountsPage.createAccountButton).toBeVisible();
      // Contains the new account
      await accountsPage.expectAccountToExist(accountName);
    });
  },
  createJar: async ({ jarsPage, jarFormPage, rootLayoutPage }, use) => {
    await use(async (jarName: string) => {
      await rootLayoutPage.navButton('Jars').click();
      await jarsPage.createJarButton.click();
      await jarFormPage.nameInput.fill(jarName);
      await jarFormPage.submitButton.click();
      // Should be redirected to the jars page
      await expect(jarsPage.createJarButton).toBeVisible();
      // Contains the new jar
      await jarsPage.expectJarToExist(jarName);
    });
  },
  categoriesPage: async ({ page }, use) => {
    await use(categoriesPageConstructor(page));
  },
  categoryFormPage: async ({ page }, use) => {
    await use(categoryFormPageConstructor(page));
  },
  createCategory: async ({ categoriesPage, categoryFormPage, rootLayoutPage }, use) => {
    await use(async (kind, categoryName) => {
      const otherKind = kind === 'Income' ? 'Expense' : 'Income';
      await rootLayoutPage.navButton('Categories').click();
      await categoriesPage.tabButton(kind).click();
      await categoriesPage.createCategoryButton(kind).click();
      await categoryFormPage.nameInput.fill(categoryName);
      await categoryFormPage.submitButton.click();

      // Should be redirected to the categories page
      await expect(categoriesPage.incomeTabButton).toBeVisible();
      await expect(categoriesPage.expensesTabButton).toBeVisible();

      // Contains the new category in the correct tab
      await categoriesPage.tabButton(kind).click();
      await categoriesPage.expectCategoryToExist(categoryName);

      // Does not contain the new category in the other tab
      await categoriesPage.tabButton(otherKind).click();
      await categoriesPage.expectCategoryToNotExist(categoryName);
    });
  },
});

export { test };
