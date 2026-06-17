import { expect } from '@playwright/test';
import { test, defaultData } from './setup';

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
      date: '2026-05-01T10:00',
      description: 'Oldest transaction',
      type: 'Income',
      accountName,
      jarName,
      categoryName,
    });
    await createTransaction({
      amount: '3000',
      date: '2026-07-01T10:00',
      description: 'Newest transaction',
      type: 'Income',
      accountName,
      jarName,
      categoryName,
    });
    await createTransaction({
      amount: '2000',
      date: '2026-06-01T10:00',
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
      .getByRole('link');

    // Verify transactions are sorted by date descending (newest first)
    await expect(transactionLinks.nth(1)).toContainText('Newest transaction');
    await expect(transactionLinks.nth(2)).toContainText('Middle transaction');
    await expect(transactionLinks.nth(3)).toContainText('Oldest transaction');
  });
});
