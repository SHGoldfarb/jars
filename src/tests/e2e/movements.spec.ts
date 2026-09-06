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
      date: '2026-06-01T10:00',
      description: 'Middle transaction',
      type: 'Income',
      accountName: originAccountName,
      jarName: originJarName,
      categoryName: defaultData.incomeCategories[0],
    });
    await createAllocation({
      amount: '2000',
      date: '2026-05-01T10:00',
      description: 'Oldest allocation',
      originJarName,
      destinationJarName,
    });
    await createTransfer({
      amount: '3000',
      date: '2026-07-01T10:00',
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
