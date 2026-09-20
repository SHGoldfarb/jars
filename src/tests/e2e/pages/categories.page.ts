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

  // The categories list of the open tab, told apart from the page's navigation lists by the add
  // action it holds - which is also the row that heads it.
  const categoriesList = (kind: 'Income' | 'Expense') =>
    page.getByRole('list').filter({ has: createCategoryButton(kind) });
  const expectCategoriesInOrder = async (kind: 'Income' | 'Expense', categoryNames: string[]) => {
    await expect(categoriesList(kind).getByRole('link')).toHaveText([
      `Add ${kind} category`,
      ...categoryNames,
    ]);
  };

  const createIncomeCategoryButton = createCategoryButton('Income');
  const createExpenseCategoryButton = createCategoryButton('Expense');

  return {
    clickCategory,
    createCategoryButton,
    createIncomeCategoryButton,
    createExpenseCategoryButton,
    expectCategoryToExist,
    expectCategoryToNotExist,
    expectCategoriesInOrder,
    getCategory,
    tabButton,
    expensesTabButton,
    incomeTabButton,
  };
};

export type CategoriesPage = ReturnType<typeof categoriesPageConstructor>;
