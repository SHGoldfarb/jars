import { test as base } from './pages.ts';

export interface CreateTransactionParams {
  amount: string;
  date: string;
  description: string;
  type: 'Income' | 'Expense';
  accountName: string;
  jarName: string;
  categoryName: string;
}

const test = base.extend<{
  createAccount: (accountName: string) => Promise<void>;
  createJar: (jarName: string) => Promise<void>;
  createDefaultData: () => Promise<void>;
  createCategory: (kind: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  createTransaction: (params: CreateTransactionParams) => Promise<void>;
  deleteAccount: (accountName: string) => Promise<void>;
  deleteCategory: (kind: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  deleteJar: (jarName: string) => Promise<void>;
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
    await use(async (params: CreateTransactionParams) => {
      await rootLayoutPage.navButton('Movements').click();
      await movementsPage.createTransactionButton.click();
      await transactionFormPage.amountInput.fill(params.amount);
      await transactionFormPage.dateInput.fill(params.date);
      await transactionFormPage.descriptionInput.fill(params.description);
      await transactionFormPage.selectType(params.type);
      await transactionFormPage.selectAccount(params.accountName);
      await transactionFormPage.selectJar(params.jarName);
      await transactionFormPage.selectCategory(params.categoryName);
      await transactionFormPage.submitButton.click();
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
});

export { test };
