import { expect } from '@playwright/test';
import { test } from './setup';

const seedCategory = (kind: 'Income' | 'Expense', name: string) =>
  kind === 'Income' ? { incomeCategories: [name] } : { expenseCategories: [name] };

(['Income', 'Expense'] as const).forEach((kind) => {
  const otherKind = kind === 'Income' ? 'Expense' : 'Income';

  test(`can create ${kind} category`, async ({
    rootLayoutPage,
    categoriesPage,
    categoryFormPage,
  }) => {
    const categoryName = `Test ${kind} Category`;

    await rootLayoutPage.navButton('Categories').click();
    await categoriesPage.tabButton(kind).click();
    await categoriesPage.createCategoryButton(kind).click();
    await categoryFormPage.nameInput.fill(categoryName);
    await categoryFormPage.submitButton.click();

    // Should be redirected to the categories page
    await expect(categoriesPage.incomeTabButton).toBeVisible();
    await expect(categoriesPage.expensesTabButton).toBeVisible();

    // Contains the new category in the correct
    await categoriesPage.tabButton(kind).click();
    await categoriesPage.expectCategoryToExist(categoryName);

    // Does not contain the new category in the other tab
    await categoriesPage.tabButton(otherKind).click();
    await categoriesPage.expectCategoryToNotExist(categoryName);
  });

  test(`can delete ${kind} category`, async ({
    rootLayoutPage,
    categoriesPage,
    categoryFormPage,
    seedData,
  }) => {
    const name = 'Category to delete';

    await seedData(seedCategory(kind, name));

    await rootLayoutPage.navButton('Categories').click();
    await categoriesPage.tabButton(kind).click();
    await categoriesPage.clickCategory(name);
    await categoryFormPage.deleteButton.click();

    // Should be redirected to the categories page
    await expect(categoriesPage.incomeTabButton).toBeVisible();
    await expect(categoriesPage.expensesTabButton).toBeVisible();

    // Does not contain the category
    await categoriesPage.tabButton(kind).click();
    await categoriesPage.expectCategoryToNotExist(name);
  });

  test(`can edit ${kind} category`, async ({
    rootLayoutPage,
    categoriesPage,
    categoryFormPage,
    seedData,
  }) => {
    const initialName = 'Category to be renamed';
    const newName = 'Renamed category';

    await seedData(seedCategory(kind, initialName));

    await rootLayoutPage.navButton('Categories').click();
    await categoriesPage.tabButton(kind).click();
    await categoriesPage.clickCategory(initialName);

    // Name input should be pre-filled with the current name
    await expect(categoryFormPage.nameInput).toHaveValue(initialName);

    // Fill and submit
    await categoryFormPage.nameInput.fill(newName);
    await categoryFormPage.submitButton.click();

    // Should be redirected to the categories page
    await expect(categoriesPage.incomeTabButton).toBeVisible();
    await expect(categoriesPage.expensesTabButton).toBeVisible();

    // Contains the updated category and not the old one
    await categoriesPage.expectCategoryToExist(newName);
    await categoriesPage.expectCategoryToNotExist(initialName);
  });
});

test('shows categories in the tab of their kind, listed alphabetically', async ({
  rootLayoutPage,
  categoriesPage,
  seedData,
}) => {
  // Seeded out of alphabetical order, so the order shown cannot be the seeded order.
  await seedData({
    incomeCategories: ['Salary', 'Bonus', 'Dividends'],
    expenseCategories: ['Rent', 'Groceries', 'Electricity'],
  });

  await rootLayoutPage.navButton('Categories').click();
  await categoriesPage.incomeTabButton.click();
  await categoriesPage.expectCategoriesInOrder('Income', ['Bonus', 'Dividends', 'Salary']);

  await categoriesPage.expensesTabButton.click();
  await categoriesPage.expectCategoriesInOrder('Expense', ['Electricity', 'Groceries', 'Rent']);
});
