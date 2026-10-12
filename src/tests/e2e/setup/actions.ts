import { testUtils } from 'src/tests/utils.ts';
import { test as base } from './pages.ts';
import { DEFAULT_MOVEMENT_DATE } from './seed.ts';

export interface CreateTransactionParams {
  amount?: string;
  date?: string;
  description?: string;
  type?: 'Income' | 'Expense';
  accountName?: string;
  jarName?: string;
  categoryName?: string;
  subcategoryName?: string;
}

const test = base.extend<{
  createTransaction: (params?: CreateTransactionParams) => Promise<void>;
  deleteCategory: (kind: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  deleteJar: (jarName: string) => Promise<void>;
}>({
  createTransaction: async ({ rootLayoutPage, movementsPage, transactionFormPage }, use) => {
    await use(async (params?: CreateTransactionParams) => {
      const defaultParams = {
        amount: (1000 + testUtils.generateIntId()).toString(),
        date: DEFAULT_MOVEMENT_DATE,
        description: `Transaction description${testUtils.generateId()}`,
        type: 'Expense',
      } as const;

      await rootLayoutPage.navButton('Movements').click();
      await movementsPage.createTransactionButton.click();
      await transactionFormPage.fillAmount(params?.amount ?? defaultParams.amount);
      await transactionFormPage.fillDate(params?.date ?? defaultParams.date);
      await transactionFormPage.fillDescription(params?.description ?? defaultParams.description);
      await transactionFormPage.selectType(params?.type ?? defaultParams.type);
      if (params?.accountName) {
        await transactionFormPage.selectAccount(params.accountName);
      } else {
        await transactionFormPage.selectFirstAccount();
      }
      if (params?.jarName) {
        await transactionFormPage.selectJar(params.jarName);
      } else {
        await transactionFormPage.selectFirstJar();
      }
      if (params?.categoryName) {
        await transactionFormPage.selectCategory(params.categoryName);
      } else {
        await transactionFormPage.selectFirstCategory();
      }
      // Left alone unless asked for: a transaction without a subcategory is a valid one, and
      // it is what every test that does not care about them gets.
      if (params?.subcategoryName) {
        await transactionFormPage.selectSubcategory(params.subcategoryName);
      }
      await transactionFormPage.submitButton.click();
    });
  },
  deleteCategory: async ({ rootLayoutPage, categoriesPage, categoryFormPage }, use) => {
    await use(async (kind, categoryName) => {
      await rootLayoutPage.navButton('Categories').click();
      await categoriesPage.tabButton(kind).click();
      await categoriesPage.clickCategory(categoryName);
      await categoryFormPage.deleteButton.click();
    });
  },
  deleteJar: async ({ rootLayoutPage, jarsPage, jarFormPage }, use) => {
    await use(async (jarName) => {
      await rootLayoutPage.navButton('Jars').click();
      await jarsPage.clickJar(jarName);
      await jarFormPage.deleteButton.click();
    });
  },
});

export { test };
