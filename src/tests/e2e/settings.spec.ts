import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import * as z from 'zod';
import { test, defaultData } from './setup';
import { runInOrder } from 'src/lib/utils';
import type { SettingsActionName } from './pages/settings.page';

const actionNames: SettingsActionName[] = [
  'Create backup',
  'Load from backup',
  'Export to CSV',
  'Import from Money Manager CSV',
  'Clear all data',
];

const descriptions: [SettingsActionName, string][] = [
  [
    'Create backup',
    'Downloads a JSON file with all your accounts, jars, categories and movements.',
  ],
  ['Load from backup', 'Restores a JSON backup created by this app.'],
  ['Export to CSV', 'Downloads your movements as a spreadsheet file.'],
  ['Import from Money Manager CSV', 'Imports a CSV exported by the Money Manager app.'],
  [
    'Clear all data',
    'Removes all accounts, jars, categories, transactions, transfers and allocations.',
  ],
];

const warnings: [SettingsActionName, string][] = [
  ['Load from backup', 'Replaces all current data. This cannot be undone.'],
  ['Import from Money Manager CSV', 'Replaces all current data. This cannot be undone.'],
  ['Clear all data', 'All current data is permanently lost and cannot be recovered.'],
];

test('settings is reachable from the main navigation', async ({ rootLayoutPage, settingsPage }) => {
  await rootLayoutPage.navButton('Settings').click();

  await runInOrder(
    actionNames.map((name) => async () => {
      await expect(settingsPage.actionTrigger(name)).toBeVisible();
    })
  );
});

test('each action explains itself, and the destructive ones warn', async ({
  rootLayoutPage,
  settingsPage,
}) => {
  await rootLayoutPage.navButton('Settings').click();

  await runInOrder([
    ...descriptions.map(([name, description]) => async () => {
      await expect(settingsPage.actionDescription(name)).toHaveText(description);
    }),
    ...warnings.map(([name, warning]) => async () => {
      await expect(settingsPage.actionWarning(name)).toHaveText(warning);
    }),
  ]);
});

test.describe('create backup', () => {
  // The file name carries the browser's local date, so the browser's zone has to be known.
  test.use({ timezoneId: 'UTC' });

  const NamedRecord = z.object({ id: z.string(), name: z.string() });

  // Declared here rather than imported so the test pins the file format from the outside:
  // a change to the app's own schemas has to be mirrored here deliberately.
  const BackupFile = z.object({
    schemaVersion: z.number(),
    createdAtISO: z.string(),
    data: z.object({
      accounts: z.array(NamedRecord),
      jars: z.array(NamedRecord),
      categories: z.array(z.object({ ...NamedRecord.shape, kind: z.string() })),
      transactions: z.array(
        z.object({
          id: z.string(),
          kind: z.string(),
          description: z.string(),
          dateISO: z.string(),
          amount: z.object({
            currency: z.string(),
            amountDecimal: z.object({ value: z.string(), decimalPlaces: z.number() }),
          }),
          accountId: z.string(),
          jarId: z.string(),
          categoryId: z.string(),
        })
      ),
      transfers: z.array(z.unknown()),
      allocations: z.array(z.unknown()),
    }),
  });

  const todayInUTC = () => {
    const now = new Date();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = now.getUTCDate().toString().padStart(2, '0');
    return `${now.getUTCFullYear().toString()}-${month}-${day}`;
  };

  test('create backup downloads a JSON file named for today', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction();

    await rootLayoutPage.navButton('Settings').click();
    const download = await settingsPage.downloadFromAction('Create backup');

    expect(download.suggestedFilename()).toMatch(/^jars-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(download.suggestedFilename()).toBe(`jars-backup-${todayInUTC()}.json`);
  });

  test('the backup contains the full database state', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({
      amount: '1234.56',
      date: '2026-02-10T09:00',
      description: 'Backed up transaction',
      type: 'Expense',
      accountName: defaultData.accounts[0],
      jarName: defaultData.jars[0],
      categoryName: defaultData.expenseCategories[0],
    });

    await rootLayoutPage.navButton('Settings').click();
    const download = await settingsPage.downloadFromAction('Create backup');
    const backup = BackupFile.parse(JSON.parse(await readFile(await download.path(), 'utf8')));

    expect(backup.schemaVersion).toBe(3);
    expect(backup.data.accounts.map(({ name }) => name)).toEqual(['Wallet']);
    expect(backup.data.jars.map(({ name }) => name)).toEqual(['Monthly expenses']);
    expect(backup.data.categories.map(({ name, kind }) => `${name} (${kind})`).sort()).toEqual([
      'Groceries (expense)',
      'Salary (income)',
    ]);
    expect(backup.data.transfers).toEqual([]);
    expect(backup.data.allocations).toEqual([]);

    expect(backup.data.transactions).toHaveLength(1);
    const transaction = backup.data.transactions[0];
    expect(transaction.description).toBe('Backed up transaction');
    expect(transaction.kind).toBe('expense');
    expect(transaction.dateISO).toBe('2026-02-10T09:00:00.000Z');
    expect(transaction.amount).toEqual({
      currency: 'CLP',
      amountDecimal: { value: '123456', decimalPlaces: 2 },
    });
    expect(transaction.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(transaction.accountId).toBe(backup.data.accounts[0].id);
    expect(transaction.jarId).toBe(backup.data.jars[0].id);
    expect(transaction.categoryId).toBe(
      backup.data.categories.find(({ name }) => name === 'Groceries')?.id
    );
  });

  test('creating a backup leaves the data untouched', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'Survives the backup' });

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.downloadFromAction('Create backup');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('Survives the backup');
  });
});
