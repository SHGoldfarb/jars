import { testUtils } from 'src/tests/utils.ts';
import { test as base } from './pages.ts';

// A fixed, valid datetime-local value for movements whose date the caller doesn't care about.
const DEFAULT_MOVEMENT_DATE = '2026-02-10T09:00';

export interface CreateTransactionParams {
  amount?: string;
  date?: string;
  description?: string;
  type?: 'Income' | 'Expense';
  accountName?: string;
  jarName?: string;
  categoryName?: string;
}

export interface CreateTransferParams {
  amount?: string;
  date?: string;
  description?: string;
  originAccountName: string;
  destinationAccountName: string;
}

const test = base.extend<{
  createAccount: (accountName: string) => Promise<void>;
  createJar: (jarName: string) => Promise<void>;
  createCategory: (kind: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  createTransaction: (params?: CreateTransactionParams) => Promise<void>;
  createTransfer: (params: CreateTransferParams) => Promise<void>;
  deleteAccount: (accountName: string) => Promise<void>;
  deleteCategory: (kind: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  deleteJar: (jarName: string) => Promise<void>;
  deleteTransaction: (transactionDescription: string) => Promise<void>;
}>({
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
  createCategory: async ({ categoriesPage, categoryFormPage, rootLayoutPage }, use) => {
    await use(async (kind, categoryName) => {
      await rootLayoutPage.navButton('Categories').click();
      await categoriesPage.tabButton(kind).click();
      await categoriesPage.createCategoryButton(kind).click();
      await categoryFormPage.nameInput.fill(categoryName);
      await categoryFormPage.submitButton.click();
    });
  },
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
      await transactionFormPage.submitButton.click();
    });
  },
  createTransfer: async ({ rootLayoutPage, movementsPage, transferFormPage }, use) => {
    await use(async (params: CreateTransferParams) => {
      const defaultParams = {
        amount: (1000 + testUtils.generateIntId()).toString(),
        date: DEFAULT_MOVEMENT_DATE,
        description: `Transfer description${testUtils.generateId()}`,
      } as const;

      await rootLayoutPage.navButton('Movements').click();
      await movementsPage.createTransferButton.click();
      await transferFormPage.fillDate(params.date ?? defaultParams.date);
      await transferFormPage.selectOriginAccount(params.originAccountName);
      await transferFormPage.selectDestinationAccount(params.destinationAccountName);
      await transferFormPage.fillAmount(params.amount ?? defaultParams.amount);
      await transferFormPage.fillDescription(params.description ?? defaultParams.description);
      await transferFormPage.submitButton.click();
    });
  },
  deleteAccount: async ({ rootLayoutPage, accountsPage, accountFormPage }, use) => {
    await use(async (accountName) => {
      await rootLayoutPage.navButton('Accounts').click();
      await accountsPage.clickAccount(accountName);
      await accountFormPage.deleteButton.click();
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
  deleteTransaction: async ({ rootLayoutPage, movementsPage, transactionFormPage }, use) => {
    await use(async (transactionDescription) => {
      await rootLayoutPage.navButton('Movements').click();
      await movementsPage.getMovement(transactionDescription).click();
      await transactionFormPage.deleteButton.click();
    });
  },
});

export { test };
