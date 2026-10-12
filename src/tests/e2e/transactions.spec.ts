import { expect } from '@playwright/test';
import { DEFAULT_MOVEMENT_DATE, defaultData, test } from './setup';
import { runInOrder } from 'src/lib/utils';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { decimal } from 'src/lib/decimal';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';

test('can create income transaction, focus flowing from one field to the next', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  page,
}) => {
  const accountName = 'Main account for income';
  const jarName = 'Main jar for income';
  const categoryName = 'Salary';
  const description = 'Payment for May';
  const amount = '1200000';
  const date = '2026-05-20T15:20';

  await seedData({ accounts: [accountName], jars: [jarName], incomeCategories: [categoryName] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransactionButton.click();

  // The type selector opens on its own
  await expect(page.getByRole('option', { name: 'Income', exact: true })).toBeVisible();
  await page.getByRole('option', { name: 'Income', exact: true }).click();

  // Picking the type opens the category selector
  await expect(page.getByRole('option', { name: categoryName, exact: true })).toBeVisible();
  await page.getByRole('option', { name: categoryName, exact: true }).click();

  // Picking the category opens the account selector
  await expect(page.getByRole('option', { name: accountName, exact: true })).toBeVisible();
  await page.getByRole('option', { name: accountName, exact: true }).click();

  // Picking the account opens the jar selector
  await expect(page.getByRole('option', { name: jarName, exact: true })).toBeVisible();
  await page.getByRole('option', { name: jarName, exact: true }).click();

  // Picking the jar moves focus to the amount field
  await expect(transactionFormPage.amountInput).toBeFocused();
  await transactionFormPage.amountInput.fill(amount);

  // Enter on the amount field moves focus to the description field
  await transactionFormPage.amountInput.press('Enter');
  await expect(transactionFormPage.descriptionInput).toBeFocused();
  await transactionFormPage.descriptionInput.fill(description);

  await transactionFormPage.fillDate(date);
  await transactionFormPage.submitButton.click();

  await expect(movementsPage.createTransactionButton).toBeVisible();
  const transactionLink = movementsPage.getMovement(description);
  await expect(transactionLink).toBeVisible();
  await expect(transactionLink.getByText(categoryName)).toBeVisible();
  await expect(transactionLink.getByText(jarName)).toBeVisible();
  await expect(transactionLink.getByText(accountName)).toBeVisible();
  await expect(
    transactionLink.getByText(
      formatCurrencyAmount({ currency: 'CLP', amountDecimal: decimal.parseString(amount) })
    )
  ).toBeVisible();
  await expect(
    transactionLink.getByText(formatDateISO(new Date(`${date}:00.000Z`).toISOString()))
  ).toBeVisible();
});

test('can edit transaction, the form opening on its current values', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  page,
}) => {
  test.slow();
  // Initial data. Named so none of it is the first option of its selector, so the test
  // genuinely checks the form loaded the transaction values, not just default selections
  const initialAccountName = 'Premium account';
  const initialJarName = 'Vacation fund';
  const initialCategoryName = 'Investments';
  const initialDescription = 'Consulting work';
  const initialAmount = '750000';
  // In the current month, so the list opens on it.
  const initialDate = DEFAULT_MOVEMENT_DATE;

  // New data (every field will change)
  const newAccountName = 'New checking';
  const newJarName = 'New savings';
  const newCategoryName = 'Utilities';
  const newDescription = 'Electric bill';
  const newAmount = '75000';
  const newDate = '2026-06-20T14:30';

  await seedData({
    accounts: [initialAccountName, newAccountName],
    jars: [initialJarName, newJarName],
    incomeCategories: [initialCategoryName],
    expenseCategories: [newCategoryName],
    transactions: [
      {
        amount: initialAmount,
        date: initialDate,
        description: initialDescription,
        type: 'Income',
        accountName: initialAccountName,
        jarName: initialJarName,
        categoryName: initialCategoryName,
      },
    ],
  });

  // Verify the initial transaction exists
  await rootLayoutPage.navButton('Movements').click();
  await expect(movementsPage.getMovement(initialDescription)).toBeVisible();

  // Open the edit form by clicking the transaction link
  await movementsPage.getMovement(initialDescription).click();

  // Verify each field has the transaction's values loaded
  await expect(transactionFormPage.amountInput).toHaveValue('$750,000');
  await expect(transactionFormPage.dateInput).toHaveValue(initialDate);
  await expect(transactionFormPage.descriptionInput).toHaveValue(initialDescription);
  await expect(page.getByRole('combobox', { name: 'Type' })).toContainText('Income');
  await expect(page.getByRole('combobox', { name: 'Account' })).toContainText(initialAccountName);
  await expect(page.getByRole('combobox', { name: 'Jar' })).toContainText(initialJarName);
  // Exact: 'Category' alone would also match the Subcategory selector.
  await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toContainText(
    initialCategoryName
  );
  // Nothing was chosen for it, so it still shows its placeholder.
  await expect(page.getByRole('combobox', { name: 'Subcategory' })).toContainText(
    'Select Subcategory'
  );

  // Change every field of the transaction
  await transactionFormPage.fillAmount(newAmount);
  await transactionFormPage.fillDate(newDate);
  await transactionFormPage.fillDescription(newDescription);
  await transactionFormPage.selectType('Expense');
  await transactionFormPage.selectAccount(newAccountName);
  await transactionFormPage.selectJar(newJarName);
  await transactionFormPage.selectCategory(newCategoryName);
  await transactionFormPage.submitButton.click();

  // Verify the transaction now shows the new values on movements page
  await expect(movementsPage.createTransactionButton).toBeVisible();
  const transactionLink = movementsPage.getMovement(newDescription);
  await expect(transactionLink).toBeVisible();
  await expect(transactionLink.getByText(newCategoryName)).toBeVisible();
  await expect(transactionLink.getByText(newJarName)).toBeVisible();
  await expect(transactionLink.getByText(newAccountName)).toBeVisible();
  await expect(
    transactionLink.getByText(
      formatCurrencyAmount({ currency: 'CLP', amountDecimal: decimal.parseString(newAmount) })
    )
  ).toBeVisible();
  await expect(
    transactionLink.getByText(formatDateISO(new Date(`${newDate}:00.000Z`).toISOString()))
  ).toBeVisible();
});

test('can delete transaction', async ({ seedData, rootLayoutPage, movementsPage, page }) => {
  const description = 'Invoice for June';

  await seedData({
    ...defaultData,
    transactions: [{ amount: '250000', description, type: 'Income' }],
  });

  // Verify the transaction exists
  await rootLayoutPage.navButton('Movements').click();
  await expect(movementsPage.getMovement(description)).toBeVisible();

  // Open the edit form by clicking the transaction link
  await movementsPage.getMovement(description).click();

  // Delete the transaction
  await page.getByRole('button', { name: 'Delete' }).click();

  // Verify the transaction no longer exists on the movements page
  await expect(movementsPage.createTransactionButton).toBeVisible();
  await expect(movementsPage.getMovement(description)).not.toBeVisible();
});

test.describe('transaction form', () => {
  test('selectors offer the active entities of the selected kind, alphabetically', async ({
    seedData,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    const incomeCategoryName = 'Dividends';

    // Everything is seeded out of alphabetical order, so the order each selector offers cannot
    // be the seeded order. The deleted entities are archived, as deleting them leaves them.
    await seedData({
      accounts: ['Wallet', 'Bank', { name: 'Deleted Account', archived: true }],
      jars: ['Travel', 'Emergency', { name: 'Deleted Jar', archived: true }],
      expenseCategories: ['Rent', 'Groceries', { name: 'Deleted Category', archived: true }],
      incomeCategories: [incomeCategoryName],
    });

    // Go to form
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();

    // Each selector offers exactly these options, so the categories of the other kind and the
    // deleted entities are not among them.
    await transactionFormPage.selectType('Income');
    await transactionFormPage.expectOptionsInOrder('Category', [incomeCategoryName]);

    await transactionFormPage.selectType('Expense');
    await transactionFormPage.expectOptionsInOrder('Category', ['Groceries', 'Rent']);
    await transactionFormPage.expectOptionsInOrder('Account', ['Bank', 'Wallet']);
    await transactionFormPage.expectOptionsInOrder('Jar', ['Emergency', 'Travel']);
  });

  test('form validations', async ({
    transactionFormPage,
    page,
    seedData,
    rootLayoutPage,
    movementsPage,
  }) => {
    await seedData(defaultData);

    // Go to form
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();

    // Validates required fields
    await transactionFormPage.submitButton.click();
    await runInOrder(
      ['Amount is required', 'Account is required', 'Category is required', 'Jar is required'].map(
        (errorMessage) => async () => {
          await expect(page.getByText(errorMessage)).toBeVisible();
        }
      )
    );

    // The amount only takes digits, so letters and a minus sign never reach it
    await transactionFormPage.amountInput.fill('asdf');
    await expect(transactionFormPage.amountInput).toHaveValue('');

    await transactionFormPage.amountInput.fill('-1');
    await expect(transactionFormPage.amountInput).toHaveValue('$1');
  });

  test('shows the amount in currency format as it is typed', async ({
    transactionFormPage,
    rootLayoutPage,
    movementsPage,
    page,
  }) => {
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();

    // The Type selector opens on arrival; close it to type into the amount.
    await page.keyboard.press('Escape');
    await transactionFormPage.amountInput.click();
    await transactionFormPage.amountInput.pressSequentially('1234567');
    await expect(transactionFormPage.amountInput).toHaveValue('$1,234,567');

    // A point starts the decimals.
    await transactionFormPage.amountInput.pressSequentially('.5');
    await expect(transactionFormPage.amountInput).toHaveValue('$1,234,567.5');

    // A digit typed in the middle lands where the caret is, and the caret stays right after it
    // even though the group separators move around it. Ten steps back from the end of
    // "$1,234,567.5" puts the caret right after the "1".
    for (let step = 0; step < 10; step++) {
      await transactionFormPage.amountInput.press('ArrowLeft');
    }
    await transactionFormPage.amountInput.pressSequentially('89');
    await expect(transactionFormPage.amountInput).toHaveValue('$189,234,567.5');
  });

  test('accepts a zero amount', async ({
    transactionFormPage,
    page,
    seedData,
    rootLayoutPage,
    movementsPage,
  }) => {
    await seedData(defaultData);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransactionButton.click();

    const description = 'Zero amount transaction';
    await transactionFormPage.fillAmount('0');
    await transactionFormPage.fillDescription(description);
    await transactionFormPage.selectType('Income');
    await transactionFormPage.selectAccount(defaultData.accounts[0]);
    await transactionFormPage.selectCategory(defaultData.incomeCategories[0]);
    await transactionFormPage.selectJar(defaultData.jars[0]);
    await transactionFormPage.submitButton.click();

    await expect(movementsPage.createTransactionButton).toBeVisible();
    await expect(page.getByText('Amount must be a non-negative number')).toBeHidden();
    const transactionLink = movementsPage.getMovement(description);
    await expect(transactionLink).toBeVisible();
  });

  test('when editing a transaction, selectors include archived entities that the transaction references, and editing restores them once their balance is no longer zero', async ({
    seedData,
    movementsPage,
    transactionFormPage,
    rootLayoutPage,
    accountsPage,
    jarsPage,
  }) => {
    test.slow();
    const accountName = 'Archived checking account';
    const jarName = 'Archived vacation fund';
    const categoryName = 'Old freelance income';
    const expenseCategoryName = 'Groceries';
    const description = 'Invoice for work done';
    const amount = '350000';

    // Archived entities, as deleting them leaves them, referenced by a transaction. A second
    // transaction with the reverse amount leaves the account and jar at the zero balance
    // deleting them requires.
    await seedData({
      accounts: [{ name: accountName, archived: true }],
      jars: [{ name: jarName, archived: true }],
      incomeCategories: [{ name: categoryName, archived: true }],
      expenseCategories: [expenseCategoryName],
      transactions: [
        { amount, description, type: 'Income', accountName, jarName, categoryName },
        {
          amount,
          description: 'reverse transaction',
          type: 'Expense',
          accountName,
          jarName,
          categoryName: expenseCategoryName,
        },
      ],
    });

    // Ensure they no longer exist
    await rootLayoutPage.navButton('Accounts').click();
    await expect(accountsPage.createAccountButton).toBeVisible();
    await accountsPage.expectAccountToNotExist(accountName);
    await rootLayoutPage.navButton('Jars').click();
    await expect(jarsPage.createJarButton).toBeVisible();
    await jarsPage.expectJarToNotExist(jarName);

    // Navigate back to movements and open the edit form for the transaction
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.getMovement(description).click();

    // The archived entities should still be visible in the selectors
    // because the transaction references them
    await transactionFormPage.expectOptionToExist('Account', accountName);
    await transactionFormPage.expectOptionToExist('Jar', jarName);
    await transactionFormPage.expectOptionToExist('Category', categoryName);

    // Editing the amount leaves the archived account and jar holding money
    await transactionFormPage.fillAmount('500');
    await transactionFormPage.submitButton.click();

    // So they should exist again
    await rootLayoutPage.navButton('Accounts').click();
    await accountsPage.expectAccountToExist(accountName);
    await rootLayoutPage.navButton('Jars').click();
    await jarsPage.expectJarToExist(jarName);
  });

  test.describe('subcategories', () => {
    test('the subcategory selector offers the selected category subcategories, and the form flows on from it', async ({
      page,
      seedData,
      rootLayoutPage,
      movementsPage,
      transactionFormPage,
    }) => {
      await seedData({
        ...defaultData,
        expenseCategories: [...defaultData.expenseCategories, 'Transport', 'Rent'],
        subcategories: [
          { categoryName: 'Groceries', name: 'Meat' },
          { categoryName: 'Groceries', name: 'Bread' },
          { categoryName: 'Transport', name: 'Bus' },
          { categoryName: 'Salary', name: 'Bonus' },
        ],
      });

      await rootLayoutPage.navButton('Movements').click();
      await movementsPage.createTransactionButton.click();
      await transactionFormPage.selectType('Expense');

      // Empty until a category is selected.
      await transactionFormPage.expectOptionsInOrder('Subcategory', []);

      // The category has subcategories, so they are what opens next, not Account: alphabetical,
      // and nothing belonging to another category.
      await transactionFormPage.selectCategory('Groceries');
      await expect(page.getByRole('option')).toHaveText(['Bread', 'Meat']);

      // Skipping them hands on to the account.
      await page.keyboard.press('Escape');
      await expect(page.getByRole('option', { name: defaultData.accounts[0] })).toBeVisible();

      // Changing the category empties the subcategory, and offers the new category's own.
      await transactionFormPage.selectSubcategory('Meat');
      await transactionFormPage.expectSelection('Subcategory', 'Meat');
      await transactionFormPage.selectCategory('Transport');
      await expect(page.getByRole('option')).toHaveText(['Bus']);
      await transactionFormPage.expectSelection('Subcategory', 'Select Subcategory');

      // Picking one of the offered subcategories leads on to the account.
      await transactionFormPage.selectCategory('Groceries');
      await page.getByRole('option', { name: 'Meat', exact: true }).click();
      await expect(page.getByRole('option', { name: defaultData.accounts[0] })).toBeVisible();

      // A category without subcategories goes straight on to the account.
      await transactionFormPage.selectCategory('Rent');
      await expect(page.getByRole('option', { name: defaultData.accounts[0] })).toBeVisible();
    });

    test('a transaction can be saved with or without a subcategory, shown beside its category', async ({
      seedData,
      createTransaction,
      movementsPage,
    }) => {
      test.slow();
      await seedData({
        ...defaultData,
        subcategories: [{ categoryName: 'Groceries', name: 'Meat' }],
      });

      await createTransaction({ description: 'No subcategory', categoryName: 'Groceries' });
      await createTransaction({
        description: 'With a subcategory',
        categoryName: 'Groceries',
        subcategoryName: 'Meat',
      });

      const withoutSubcategory = movementsPage.getMovement('No subcategory');
      await expect(withoutSubcategory).toBeVisible();
      await expect(withoutSubcategory.getByText('Groceries')).toBeVisible();
      await expect(withoutSubcategory.getByText('Meat')).toHaveCount(0);

      await expect(
        movementsPage.getMovement('With a subcategory').getByText('Groceries · Meat')
      ).toBeVisible();
    });

    test('a transaction subcategory can be changed by editing it', async ({
      seedData,
      rootLayoutPage,
      movementsPage,
      transactionFormPage,
    }) => {
      await seedData({
        ...defaultData,
        subcategories: [
          { categoryName: 'Groceries', name: 'Meat' },
          { categoryName: 'Groceries', name: 'Bread' },
        ],
        transactions: [
          {
            description: 'Changing subcategory',
            categoryName: 'Groceries',
            subcategoryName: 'Meat',
          },
        ],
      });

      await rootLayoutPage.navButton('Movements').click();
      await movementsPage.getMovement('Changing subcategory').click();
      // The form opens on what was saved.
      await transactionFormPage.expectSelection('Subcategory', 'Meat');
      await transactionFormPage.selectSubcategory('Bread');
      await transactionFormPage.submitButton.click();

      await expect(
        movementsPage.getMovement('Changing subcategory').getByText('Groceries · Bread')
      ).toBeVisible();
    });
  });
});
