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

test('movements list shows transactions, transfers and allocations interleaved by date descending', async ({
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
  const transaction = {
    amount: '1000',
    type: 'Income',
    accountName: originAccountName,
    jarName: originJarName,
    categoryName: defaultData.incomeCategories[0],
  } as const;

  await createAccount(destinationAccountName);
  await createJar(destinationJarName);

  // Movements of every kind, and more than one transaction, created in non-sorted order
  await createTransaction({
    ...transaction,
    date: monthDate(0, 3),
    description: 'Middle transaction',
  });
  await createTransaction({
    ...transaction,
    date: monthDate(0, 1),
    description: 'Oldest transaction',
  });
  await createAllocation({
    amount: '2000',
    date: monthDate(0, 2),
    description: 'Older allocation',
    originJarName,
    destinationJarName,
  });
  await createTransfer({
    amount: '3000',
    date: monthDate(0, 4),
    description: 'Newest transfer',
    originAccountName,
    destinationAccountName,
  });

  await rootLayoutPage.navButton('Movements').click();

  // Find the movement list (role="list" that contains "Add transaction") and get all links
  // within it to exclude nav links in other lists
  const movementLinks = page
    .getByRole('list')
    .filter({ hasText: 'Add transaction' })
    .getByRole('link')
    .filter({ hasNotText: /^Add / });

  // The kinds are interleaved by date descending, each labelled with its own kind
  await expect(movementLinks.nth(0)).toContainText('Newest transfer');
  await expect(movementLinks.nth(0)).toContainText('Transfer');
  await expect(movementLinks.nth(1)).toContainText('Middle transaction');
  await expect(movementLinks.nth(1)).toContainText('Transaction');
  await expect(movementLinks.nth(2)).toContainText('Older allocation');
  await expect(movementLinks.nth(2)).toContainText('Allocation');
  await expect(movementLinks.nth(3)).toContainText('Oldest transaction');
  await expect(movementLinks.nth(3)).toContainText('Transaction');
});

test.describe('movements month selector', () => {
  test('the list is browsed one month at a time', async ({
    createDefaultData,
    createTransaction,
    page,
    rootLayoutPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransactionOn(createTransaction, thisMonthTransaction);
    await createTransactionOn(createTransaction, lastMonthTransaction);
    await createTransactionOn(createTransaction, twoMonthsOnTransaction);

    // The list opens on the current month, listing only that month's movements.
    await rootLayoutPage.navButton('Movements').click();
    await expect(movementsPage.monthSelect).toHaveText(monthLabel(0));
    await movementsPage.expectMovementToExist(thisMonthTransaction.description);
    await movementsPage.expectMovementToNotExist(lastMonthTransaction.description);
    await movementsPage.expectMovementToNotExist(twoMonthsOnTransaction.description);

    // The dropdown offers the months that have movements. Nothing is dated in next month, and
    // the arrows are how an empty month is reached.
    await movementsPage.expectMonthOptionToExist(monthLabel(-1));
    await movementsPage.expectMonthOptionToExist(monthLabel(0));
    await movementsPage.expectMonthOptionToExist(monthLabel(2));
    await movementsPage.expectMonthOptionToNotExist(monthLabel(1));

    // The previous month button moves the list one month back.
    await movementsPage.previousMonthButton.click();
    await expect(movementsPage.monthSelect).toHaveText(monthLabel(-1));
    await movementsPage.expectMovementToExist(lastMonthTransaction.description);
    await movementsPage.expectMovementToNotExist(thisMonthTransaction.description);

    // The next month button moves it one month forward, twice reaching a month with no
    // movements, which says so.
    await movementsPage.nextMonthButton.click();
    await expect(movementsPage.monthSelect).toHaveText(monthLabel(0));
    await movementsPage.expectMovementToExist(thisMonthTransaction.description);

    await movementsPage.nextMonthButton.click();
    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));
    await movementsPage.expectMovementToNotExist(thisMonthTransaction.description);
    await expect(page.getByText(`No movements in ${monthLabel(1)}`)).toBeVisible();

    // A month can be picked from the dropdown.
    await movementsPage.selectMonth(monthLabel(2));
    await expect(movementsPage.monthSelect).toHaveText(monthLabel(2));
    await movementsPage.expectMovementToExist(twoMonthsOnTransaction.description);
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
