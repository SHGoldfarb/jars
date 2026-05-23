import { expect } from '@playwright/test';
import { test } from './setup';
import { runInOrder } from 'src/lib/utils';

test('shows categories', async ({ categoriesPage, createCategory }) => {
  test.slow();
  const incomeCategoryNames = ['Salary', 'Investments'];
  const expenseCategoryNames = ['Groceries', 'Rent'];

  // Create categories
  await runInOrder([
    ...incomeCategoryNames.map((categoryName) => () => createCategory('Income', categoryName)),
    ...expenseCategoryNames.map((categoryName) => () => createCategory('Expense', categoryName)),
  ]);

  // Test that they are visible in the correct tab
  await categoriesPage.incomeTabButton.click();
  await runInOrder(
    incomeCategoryNames.map(
      (categoryName) => () => categoriesPage.expectCategoryToExist(categoryName)
    )
  );
  await runInOrder(
    expenseCategoryNames.map(
      (categoryName) => () => categoriesPage.expectCategoryToNotExist(categoryName)
    )
  );

  await categoriesPage.expensesTabButton.click();
  await runInOrder(
    expenseCategoryNames.map(
      (categoryName) => () => categoriesPage.expectCategoryToExist(categoryName)
    )
  );
  await runInOrder(
    incomeCategoryNames.map(
      (categoryName) => () => categoriesPage.expectCategoryToNotExist(categoryName)
    )
  );
});

(['Income', 'Expense'] as const).forEach((kind) => {
  const otherKind = kind === 'Income' ? 'Expense' : 'Income';

  test(`can create ${kind} category`, async ({ categoriesPage, categoryFormPage }) => {
    const categoryName = `Test ${kind} Category`;

    await categoriesPage.goto();
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
    categoriesPage,
    categoryFormPage,
    createCategory,
  }) => {
    const name = 'Category to delete';

    await createCategory(kind, name);

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
    categoriesPage,
    categoryFormPage,
    createCategory,
  }) => {
    const initialName = 'Category to be renamed';
    const newName = 'Renamed category';

    await createCategory(kind, initialName);

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
