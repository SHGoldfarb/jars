import { test as base } from './setup/actions';
import { runInOrder } from 'src/lib/utils';

export const defaultData = {
  incomeCategories: ['Salary'],
  expenseCategories: ['Groceries'],
  accounts: ['Wallet'],
  jars: ['Monthly expenses'],
};

const test = base.extend<{
  createDefaultData: () => Promise<void>;
}>({
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
