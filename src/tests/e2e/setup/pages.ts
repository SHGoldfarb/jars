import { test as base } from '@playwright/test';
import { accountsPageConstructor, type AccountsPage } from '../pages/accounts.page';
import { accountFormPageConstructor, type AccountFormPage } from '../pages/accountsForm.page';
import { jarsPageConstructor, type JarsPage } from '../pages/jars.page';
import { jarFormPageConstructor, type JarFormPage } from '../pages/jarsForm.page';
import { categoriesPageConstructor, type CategoriesPage } from '../pages/categories.page';
import { categoryFormPageConstructor, type CategoryFormPage } from '../pages/categoriesForm.page';
import { rootLayoutPageConstructor, type RootLayoutPage } from '../pages/rootLayout.page';
import { movementsPageConstructor, type MovementsPage } from '../pages/movements.page';
import {
  transactionFormPageConstructor,
  type TransactionFormPage,
} from '../pages/transactionForm.page';
import { transferFormPageConstructor, type TransferFormPage } from '../pages/transferForm.page';
import {
  allocationFormPageConstructor,
  type AllocationFormPage,
} from '../pages/allocationForm.page';

const test = base.extend<{
  accountsPage: AccountsPage;
  accountFormPage: AccountFormPage;
  jarsPage: JarsPage;
  jarFormPage: JarFormPage;
  categoriesPage: CategoriesPage;
  categoryFormPage: CategoryFormPage;
  rootLayoutPage: RootLayoutPage;
  movementsPage: MovementsPage;
  transactionFormPage: TransactionFormPage;
  transferFormPage: TransferFormPage;
  allocationFormPage: AllocationFormPage;
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
  transferFormPage: async ({ page }, use) => {
    await use(transferFormPageConstructor(page));
  },
  allocationFormPage: async ({ page }, use) => {
    await use(allocationFormPageConstructor(page));
  },
});

export { test };
