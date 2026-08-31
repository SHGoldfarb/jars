import { expect, type Page } from '@playwright/test';

export const categoriesPageConstructor = (page: Page) => {
  const createCategoryButton = (kind: 'Income' | 'Expense') =>
    page.getByRole('link', { name: `Add ${kind} category` });

  const getCategory = (categoryName: string) => page.getByRole('link', { name: categoryName });
  const expectCategoryToExist = async (categoryName: string) => {
    await expect(getCategory(categoryName)).toBeVisible();
  };
  const expectCategoryToNotExist = async (categoryName: string) => {
    await expect(getCategory(categoryName)).not.toBeVisible();
  };
  const clickCategory = (categoryName: string) => getCategory(categoryName).click();
  const tabButton = (kind: 'Income' | 'Expense') =>
    page.getByRole('link', { name: kind, exact: true });

  const expensesTabButton = tabButton('Expense');
  const incomeTabButton = tabButton('Income');

  const createIncomeCategoryButton = createCategoryButton('Income');
  const createExpenseCategoryButton = createCategoryButton('Expense');

  return {
    clickCategory,
    createCategoryButton,
    createIncomeCategoryButton,
    createExpenseCategoryButton,
    expectCategoryToExist,
    expectCategoryToNotExist,
    getCategory,
    tabButton,
    expensesTabButton,
    incomeTabButton,
  };
};

export type CategoriesPage = ReturnType<typeof categoriesPageConstructor>;
