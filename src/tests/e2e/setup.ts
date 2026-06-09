import { test as base } from '@playwright/test';
import { accountsPageConstructor, type AccountsPage } from './pages/accounts.page';
import { accountFormPageConstructor, type AccountFormPage } from './pages/accountsForm.page';
import { jarsPageConstructor, type JarsPage } from './pages/jars.page';
import { jarFormPageConstructor, type JarFormPage } from './pages/jarsForm.page';
import { categoriesPageConstructor, type CategoriesPage } from './pages/categories.page';
import { categoryFormPageConstructor, type CategoryFormPage } from './pages/categoriesForm.page';
import { rootLayoutPageConstructor, type RootLayoutPage } from './pages/rootLayout.page';
import { movementsPageConstructor, type MovementsPage } from './pages/movements.page';
import {
  transactionFormPageConstructor,
  type TransactionFormPage,
} from './pages/transactionForm.page';
import { runInOrder } from 'src/lib/utils';

export const defaultData = {
  incomeCategories: ['Salary'],
  expenseCategories: ['Groceries'],
  accounts: ['Wallet'],
  jars: ['Monthly expenses'],
};

const test = base.extend<{
  accountsPage: AccountsPage;
  accountFormPage: AccountFormPage;
  jarsPage: JarsPage;
  jarFormPage: JarFormPage;
  createAccount: (accountName: string) => Promise<void>;
  createJar: (jarName: string) => Promise<void>;
  createDefaultData: () => Promise<void>;
  categoriesPage: CategoriesPage;
  categoryFormPage: CategoryFormPage;
  createCategory: (kind: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  rootLayoutPage: RootLayoutPage;
  movementsPage: MovementsPage;
  transactionFormPage: TransactionFormPage;
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
    });
  },
  createJar: async ({ jarsPage, jarFormPage, rootLayoutPage }, use) => {
    await use(async (jarName: string) => {
      await rootLayoutPage.navButton('Jars').click();
      await jarsPage.createJarButton.click();
      await jarFormPage.nameInput.fill(jarName);
      await jarFormPage.submitButton.click();
    });
  },
  categoriesPage: async ({ page }, use) => {
    await use(categoriesPageConstructor(page));
  },
  categoryFormPage: async ({ page }, use) => {
    await use(categoryFormPageConstructor(page));
  },
  movementsPage: async ({ page }, use) => {
    await use(movementsPageConstructor(page));
  },
  transactionFormPage: async ({ page }, use) => {
    await use(transactionFormPageConstructor(page));
  },
  createCategory: async ({ categoriesPage, categoryFormPage, rootLayoutPage }, use) => {
    await use(async (kind, categoryName) => {
      await rootLayoutPage.navButton('Categories').click();
      await categoriesPage.tabButton(kind).click();
      await categoriesPage.createCategoryButton(kind).click();
      await categoryFormPage.nameInput.fill(categoryName);
      await categoryFormPage.submitButton.click();
    });
  },
  createDefaultData: async ({ createCategory, createAccount, createJar }, use) => {
    await use(async () => {
      await runInOrder([
        ...defaultData.incomeCategories.map((name) => async () => {
          await createCategory('Income', name);
        }),
        ...defaultData.expenseCategories.map((name) => async () => {
          await createCategory('Expense', name);
        }),
        ...defaultData.accounts.map((name) => async () => {
          await createAccount(name);
        }),
        ...defaultData.jars.map((name) => async () => {
          await createJar(name);
        }),
      ]);
    });
  },
});

export { test };
