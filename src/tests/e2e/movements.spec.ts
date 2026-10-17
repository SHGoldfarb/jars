import { expect } from '@playwright/test';
import { test, defaultData } from './setup';

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

test('movements list shows transactions, transfers and allocations interleaved by date descending', async ({
  seedData,
  page,
  rootLayoutPage,
}) => {
  const originAccountName = defaultData.accounts[0];
  const destinationAccountName = 'Second account';
  const originJarName = defaultData.jars[0];
  const destinationJarName = 'Second jar';

  // Movements of every kind, and more than one transaction, seeded in non-sorted order
  await seedData({
    ...defaultData,
    accounts: [originAccountName, destinationAccountName],
    jars: [originJarName, destinationJarName],
    transactions: [
      { type: 'Income', date: monthDate(0, 3), description: 'Middle transaction' },
      { type: 'Income', date: monthDate(0, 1), description: 'Oldest transaction' },
    ],
    allocations: [
      {
        amount: '2000',
        date: monthDate(0, 2),
        description: 'Older allocation',
        originJarName,
        destinationJarName,
      },
    ],
    transfers: [
      {
        amount: '3000',
        date: monthDate(0, 4),
        description: 'Newest transfer',
        originAccountName,
        destinationAccountName,
      },
    ],
  });

  await rootLayoutPage.navButton('Movements').click();

  // Find the movement list (role="list" that contains "Add transaction") and get all links
  // within it to exclude nav links in other lists, leaving out the list's own actions
  const movementLinks = page
    .getByRole('list')
    .filter({ hasText: 'Add transaction' })
    .getByRole('link')
    .filter({ hasNotText: /^(Add .*|Bookmarks)$/ });

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
    seedData,
    page,
    rootLayoutPage,
    movementsPage,
  }) => {
    await seedData({
      ...defaultData,
      transactions: [thisMonthTransaction, lastMonthTransaction, twoMonthsOnTransaction],
    });

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
    seedData,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
    bookmarksPage,
  }) => {
    await seedData({ ...defaultData, bookmarks: [{ description: 'Bookmarked rent' }] });

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.nextMonthButton.click();
    await movementsPage.createTransactionButton.click();
    await transactionFormPage.cancelButton.click();

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));

    // Started from a bookmark, by way of the bookmarks menu, it still remembers the month.
    await movementsPage.bookmarksButton.click();
    await bookmarksPage.getBookmark('Bookmarked rent').click();
    await transactionFormPage.cancelButton.click();

    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));
  });

  test('saving a movement into another month follows it there', async ({
    seedData,
    rootLayoutPage,
    movementsPage,
    transactionFormPage,
  }) => {
    await seedData({ ...defaultData, transactions: [thisMonthTransaction] });

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.getMovement(thisMonthTransaction.description).click();
    await transactionFormPage.fillDate(nextMonthTransaction.date);
    await transactionFormPage.submitButton.click();

    await expect(movementsPage.createTransactionButton).toBeVisible();
    await expect(movementsPage.monthSelect).toHaveText(monthLabel(1));
    await movementsPage.expectMovementToExist(thisMonthTransaction.description);
  });
});
