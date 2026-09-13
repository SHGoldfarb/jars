import { expect } from '@playwright/test';
import { test, defaultData } from './setup';
import type { CreateTransactionParams } from './setup/actions';

// Pin locale/timezone: the month labels asserted below are rendered by the browser.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

// Movements opens on the current month, so the dates these tests use are relative to it. They
// are inputs, not expectations - what is asserted is which rows are listed, and the month label
// is formatted independently of the app below.
const monthDate = (monthOffset: number, day: number) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, day, 10, 0))
    .toISOString()
    .slice(0, 16);
};

// Formatted here rather than with the app's formatYearMonth, so a regression in that formatter
// fails these tests instead of hiding in both sides of the assertion.
const monthLabel = (monthOffset: number) => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1)));
};

const thisMonthTransaction = {
  date: monthDate(0, 10),
  description: 'This month transaction',
} as const;
const nextMonthTransaction = {
  date: monthDate(1, 10),
  description: 'Next month transaction',
} as const;
const lastMonthTransaction = {
  date: monthDate(-1, 10),
  description: 'Last month transaction',
} as const;
const twoMonthsOnTransaction = {
  date: monthDate(2, 10),
  description: 'Two months on transaction',
} as const;

// The month selector tests only care about when a movement is dated, so everything else comes
// from the default data.
const createTransactionOn = (
  createTransaction: (params: CreateTransactionParams) => Promise<void>,
  { date, description }: { date: string; description: string }
) =>
  createTransaction({
    amount: '1000',
    date,
    description,
    type: 'Income',
    accountName: defaultData.accounts[0],
    jarName: defaultData.jars[0],
    categoryName: defaultData.incomeCategories[0],
  });

test.describe('movements list ordering', () => {
  test('transactions are shown ordered by date descending', async ({
    createDefaultData,
    createTransaction,
    page,
    rootLayoutPage,
  }) => {
    test.slow();

    await createDefaultData();

    const accountName = defaultData.accounts[0];
    const jarName = defaultData.jars[0];
    const categoryName = defaultData.incomeCategories[0];

    // Create transactions with different dates (entered in non-sorted order)
    await createTransaction({
      amount: '1000',
      date: monthDate(0, 1),
      description: 'Oldest transaction',
      type: 'Income',
      accountName,
      jarName,
      categoryName,
    });
    await createTransaction({
      amount: '3000',
      date: monthDate(0, 3),
      description: 'Newest transaction',
      type: 'Income',
      accountName,
      jarName,
      categoryName,
    });
    await createTransaction({
      amount: '2000',
      date: monthDate(0, 2),
      description: 'Middle transaction',
      type: 'Income',
      accountName,
      jarName,
      categoryName,
    });

    // Navigate to movements to see all transactions sorted
    await rootLayoutPage.navButton('Movements').click();

    // Find the transaction list (role="list" that contains "Add transaction")
    // and get all links within it to exclude nav links in other lists
    const transactionLinks = page
      .getByRole('list')
      .filter({ hasText: 'Add transaction' })
      .getByRole('link')
      .filter({ hasNotText: /^Add / });

    // Verify transactions are sorted by date descending (newest first)
    await expect(transactionLinks.nth(0)).toContainText('Newest transaction');
    await expect(transactionLinks.nth(1)).toContainText('Middle transaction');
    await expect(transactionLinks.nth(2)).toContainText('Oldest transaction');
  });

  test('movements list shows transactions, transfers and allocations interleaved', async ({
    createDefaultData,
    createAccount,
    createJar,
    createTransaction,
    createTransfer,
    createAllocation,
    page,
    rootLayoutPage,
  }) => {
    test.slow();

    await createDefaultData();

    const originAccountName = defaultData.accounts[0];
    const destinationAccountName = 'Second account';
    const originJarName = defaultData.jars[0];
    const destinationJarName = 'Second jar';

    await createAccount(destinationAccountName);
    await createJar(destinationJarName);

    // One movement of each kind, created in non-sorted order
    await createTransaction({
      amount: '1000',
      date: monthDate(0, 2),
      description: 'Middle transaction',
      type: 'Income',
      accountName: originAccountName,
      jarName: originJarName,
      categoryName: defaultData.incomeCategories[0],
    });
    await createAllocation({
      amount: '2000',
      date: monthDate(0, 1),
      description: 'Oldest allocation',
      originJarName,
      destinationJarName,
    });
    await createTransfer({
      amount: '3000',
      date: monthDate(0, 3),
      description: 'Newest transfer',
      originAccountName,
      destinationAccountName,
    });

    await rootLayoutPage.navButton('Movements').click();

    const movementLinks = page
      .getByRole('list')
      .filter({ hasText: 'Add transaction' })
      .getByRole('link')
      .filter({ hasNotText: /^Add / });

    // The three kinds are interleaved by date descending, each labelled with its own kind
    await expect(movementLinks.nth(0)).toContainText('Newest transfer');
    await expect(movementLinks.nth(0)).toContainText('Transfer');
    await expect(movementLinks.nth(1)).toContainText('Middle transaction');
    await expect(movementLinks.nth(1)).toContainText('Transaction');
    await expect(movementLinks.nth(2)).toContainText('Oldest allocation');
    await expect(movementLinks.nth(2)).toContainText('Allocation');
  });
});

test.describe('movements month selector', () => {
  test('the list opens on the current month', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);

    await rootLayoutPage.navButton('Movements').click();

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(0));
    await movementsPage.expectMovementToExist(thisMonthTransaction.description);
  });

  test('only the movements of the selected month are listed', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);
    await createTransactionOn(createTransaction, nextMonthTransaction);

    await rootLayoutPage.navButton('Movements').click();

    await movementsPage.expectMovementToExist(thisMonthTransaction.description);
    await movementsPage.expectMovementToNotExist(nextMonthTransaction.description);
  });

  test('the next month button moves the list one month forward', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);
    await createTransactionOn(createTransaction, nextMonthTransaction);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.nextMonthButton.click();

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));
    await movementsPage.expectMovementToExist(nextMonthTransaction.description);
    await movementsPage.expectMovementToNotExist(thisMonthTransaction.description);
  });

  test('the previous month button moves the list one month back', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);
    await createTransactionOn(createTransaction, lastMonthTransaction);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.previousMonthButton.click();

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(-1));
    await movementsPage.expectMovementToExist(lastMonthTransaction.description);
    await movementsPage.expectMovementToNotExist(thisMonthTransaction.description);
  });

  test('a month can be picked from the dropdown', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);
    await createTransactionOn(createTransaction, twoMonthsOnTransaction);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.selectMonth(monthLabel(2));

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(2));
    await movementsPage.expectMovementToExist(twoMonthsOnTransaction.description);
    await movementsPage.expectMovementToNotExist(thisMonthTransaction.description);
  });

  test('the dropdown offers the months that have movements', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);
    await createTransactionOn(createTransaction, twoMonthsOnTransaction);

    await rootLayoutPage.navButton('Movements').click();

    await movementsPage.expectMonthOptionToExist(monthLabel(0));
    await movementsPage.expectMonthOptionToExist(monthLabel(2));
    // Nothing is dated in the month between them, and the arrows are how an empty month is
    // reached.
    await movementsPage.expectMonthOptionToNotExist(monthLabel(1));
  });

  test('the selected month survives a reload', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
    page,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, nextMonthTransaction);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.nextMonthButton.click();
    await page.reload();

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));
    await movementsPage.expectMovementToExist(nextMonthTransaction.description);
  });

  test('a month with no movements says so', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
    page,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.nextMonthButton.click();

    await expect(page.getByText(`No movements in ${monthLabel(1)}`)).toBeVisible();
  });

  test('cancelling a new movement returns to the month it was started from', async ({
    createDefaultData,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();

    await createDefaultData();

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.nextMonthButton.click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.cancelButton.click();

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));
  });

  test('saving a movement into another month follows it there', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.getMovement(thisMonthTransaction.description).click();
    await transactionFormPage.fillDate(nextMonthTransaction.date);
    await transactionFormPage.submitButton.click();

    await expect(movementsPage.createTransactionButton).toBeVisible();
    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));
    await movementsPage.expectMovementToExist(thisMonthTransaction.description);
  });
});
