import { expect } from '@playwright/test';
import * as z from 'zod';
import { test, defaultData } from './setup';
import { runInOrder } from 'src/lib/utils';
import type { SettingsActionName, SettingsPage } from './pages/settings.page';

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

// The file names carry the browser's local date, so a test that asserts one pins the zone.
const todayInUTC = () => {
  const now = new Date();
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');
  return `${now.getUTCFullYear().toString()}-${month}-${day}`;
};

test.describe('create backup', () => {
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
    const backup = BackupFile.parse(
      JSON.parse(await settingsPage.downloadContentsFromAction('Create backup'))
    );

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

const jsonFile = (contents: string) => ({
  name: 'jars-backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(contents),
});

test.describe('load from backup', () => {
  // Hand-written rather than derived from a real backup, so the file the app must accept is
  // spelled out here and a change to it has to be mirrored deliberately.
  const uuid = (digit: string) =>
    `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;

  const handWrittenBackup = (overrides: {
    schemaVersion?: number;
    accountId?: string;
    omitJars?: boolean;
  }) => {
    const jars = [{ id: uuid('2'), name: 'Hand-written jar' }];
    return JSON.stringify({
      schemaVersion: overrides.schemaVersion ?? 3,
      createdAtISO: '2026-02-10T09:00:00.000Z',
      data: {
        accounts: [{ id: uuid('1'), name: 'Hand-written account' }],
        ...(overrides.omitJars ? {} : { jars }),
        categories: [{ id: uuid('3'), name: 'Hand-written category', kind: 'expense' }],
        transactions: [
          {
            id: uuid('4'),
            kind: 'expense',
            description: 'Hand-written transaction',
            dateISO: '2026-02-10T09:00:00.000Z',
            amount: { currency: 'CLP', amountDecimal: { value: '1000', decimalPlaces: 0 } },
            accountId: overrides.accountId ?? uuid('1'),
            jarId: uuid('2'),
            categoryId: uuid('3'),
          },
        ],
        transfers: [],
        allocations: [],
      },
    });
  };

  test('a backup created from the app can be loaded back into it', async ({
    createDefaultData,
    createAccount,
    createJar,
    createTransaction,
    createTransfer,
    createAllocation,
    rootLayoutPage,
    settingsPage,
    movementsPage,
    accountsPage,
    jarsPage,
  }) => {
    test.slow();

    const secondAccountName = 'Savings';
    const secondJarName = 'Holidays';

    await createDefaultData();
    await createAccount(secondAccountName);
    await createJar(secondJarName);
    await createTransaction({
      amount: '10000',
      description: 'Backed up income',
      type: 'Income',
      accountName: defaultData.accounts[0],
      jarName: defaultData.jars[0],
      categoryName: defaultData.incomeCategories[0],
    });
    await createTransfer({
      amount: '5000',
      description: 'Backed up transfer',
      originAccountName: defaultData.accounts[0],
      destinationAccountName: secondAccountName,
    });
    await createAllocation({
      amount: '2000',
      description: 'Backed up allocation',
      originJarName: defaultData.jars[0],
      destinationJarName: secondJarName,
    });

    await rootLayoutPage.navButton('Settings').click();
    const backup = await settingsPage.downloadContentsFromAction('Create backup');

    await settingsPage.clickActionAndConfirm('Clear all data');
    await expect(settingsPage.statusMessage).toHaveText('All data cleared.');
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToNotExist('Backed up income');

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.pickFileAndConfirm('Load from backup', jsonFile(backup));
    await expect(settingsPage.statusMessage).toHaveText('Backup restored.');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('Backed up income');
    await movementsPage.expectMovementToExist('Backed up transfer');
    await movementsPage.expectMovementToExist('Backed up allocation');

    // Expected strings are hardcoded for the hardcoded amounts above:
    // 10000 income - 5000 transferred out, and the 5000 that arrived in the second account.
    await rootLayoutPage.navButton('Accounts').click();
    await expect(accountsPage.getAccount(defaultData.accounts[0])).toContainText('$5.000');
    await expect(accountsPage.getAccount(secondAccountName)).toContainText('$5.000');

    // 10000 income - 2000 allocated away, and the 2000 that arrived in the second jar.
    await rootLayoutPage.navButton('Jars').click();
    await expect(jarsPage.getJar(defaultData.jars[0])).toContainText('$8.000');
    await expect(jarsPage.getJar(secondJarName)).toContainText('$2.000');
  });

  test('restoring replaces the current data rather than merging into it', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'In the backup' });

    await rootLayoutPage.navButton('Settings').click();
    const backup = await settingsPage.downloadContentsFromAction('Create backup');

    await createTransaction({ description: 'Created after the backup' });

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.pickFileAndConfirm('Load from backup', jsonFile(backup));
    await expect(settingsPage.statusMessage).toHaveText('Backup restored.');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('In the backup');
    await movementsPage.expectMovementToNotExist('Created after the backup');
  });

  test('restored data appears without a manual refresh', async ({
    createDefaultData,
    createTransaction,
    deleteTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'Restored without a refresh' });

    await rootLayoutPage.navButton('Settings').click();
    const backup = await settingsPage.downloadContentsFromAction('Create backup');

    await deleteTransaction('Restored without a refresh');

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.pickFileAndConfirm('Load from backup', jsonFile(backup));
    await expect(settingsPage.statusMessage).toHaveText('Backup restored.');

    // No reload: the movements list has to come back from a database that was replaced under it.
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('Restored without a refresh');
  });

  test('a restored database survives a reload', async ({
    createDefaultData,
    createTransaction,
    deleteTransaction,
    page,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'Restored and reloaded' });

    await rootLayoutPage.navButton('Settings').click();
    const backup = await settingsPage.downloadContentsFromAction('Create backup');

    await deleteTransaction('Restored and reloaded');

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.pickFileAndConfirm('Load from backup', jsonFile(backup));
    await expect(settingsPage.statusMessage).toHaveText('Backup restored.');

    await page.reload();
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('Restored and reloaded');
  });

  test('the restore is confirmed before anything is written', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'In the backup' });

    await rootLayoutPage.navButton('Settings').click();
    const backup = await settingsPage.downloadContentsFromAction('Create backup');

    await createTransaction({ description: 'Created after the backup' });

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.pickFile('Load from backup', jsonFile(backup));

    await expect(settingsPage.confirmDialog('Load from backup')).toContainText(
      'This replaces all current data and it cannot be recovered.'
    );
    await settingsPage.cancelButton('Load from backup').click();
    await expect(settingsPage.confirmDialog('Load from backup')).toBeHidden();

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('In the backup');
    await movementsPage.expectMovementToExist('Created after the backup');
  });

  const rejectedFiles: [string, string, string][] = [
    [
      'a file that is not JSON at all',
      'this is not a backup, it is just a sentence',
      'The file is not valid JSON.',
    ],
    [
      'a backup missing the jars array',
      handWrittenBackup({ omitJars: true }),
      'This file is not a valid backup (data.jars: Invalid input: expected array, received undefined).',
    ],
    [
      'a backup whose transaction points at a malformed account id',
      handWrittenBackup({ accountId: 'not-a-uuid' }),
      'This file is not a valid backup (data.transactions.0.accountId: Invalid UUID).',
    ],
    [
      'a backup from an unsupported schema version',
      handWrittenBackup({ schemaVersion: 99 }),
      'This backup was taken from an unsupported version of the app.',
    ],
  ];

  rejectedFiles.forEach(([caseName, contents, expectedError]) => {
    test(`${caseName} is rejected with an explanation and changes nothing`, async ({
      createDefaultData,
      createTransaction,
      rootLayoutPage,
      settingsPage,
      movementsPage,
    }) => {
      test.slow();

      await createDefaultData();
      await createTransaction({ description: 'Survives the rejected file' });

      await rootLayoutPage.navButton('Settings').click();
      await settingsPage.pickFileAndConfirm('Load from backup', jsonFile(contents));
      await expect(settingsPage.statusMessage).toHaveText(expectedError);

      await rootLayoutPage.navButton('Movements').click();
      await movementsPage.expectMovementToExist('Survives the rejected file');
    });
  });
});

test.describe('export to CSV', () => {
  test.use({ timezoneId: 'UTC' });

  const csvFile = (contents: string) => ({
    name: 'jars-export.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(contents),
  });

  // The header the file must be written with, spelled out here so a change to the columns has
  // to be mirrored deliberately.
  const header =
    'Type,Date,Description,Amount,Currency,Account,Category,Jar,' +
    'Origin account,Destination account,Origin jar,Destination jar';

  const csvLines = (contents: string) => contents.split('\r\n');

  // Amounts a form cannot type and descriptions a single-line field cannot hold still reach
  // the database through a restore, so that is how the export is shown them here. Written out
  // rather than derived from a real backup, so every value the file is judged on is visible.
  const id = (suffix: number) => `00000000-0000-4000-8000-${suffix.toString().padStart(12, '0')}`;
  const accountId = id(1);
  const jarId = id(2);
  const categoryId = id(3);

  interface StoredTransaction {
    description: string;
    amountDecimal: { value: string; decimalPlaces: number };
  }

  const backupWith = (transactions: StoredTransaction[]) =>
    JSON.stringify({
      schemaVersion: 3,
      createdAtISO: '2026-02-10T09:00:00.000Z',
      data: {
        accounts: [{ id: accountId, name: 'Wallet' }],
        jars: [{ id: jarId, name: 'Monthly expenses' }],
        categories: [{ id: categoryId, name: 'Groceries', kind: 'expense' }],
        transactions: transactions.map(({ description, amountDecimal }, index) => ({
          id: id(100 + index),
          kind: 'expense',
          description,
          dateISO: '2026-02-10T09:00:00.000Z',
          amount: { currency: 'CLP', amountDecimal },
          accountId,
          jarId,
          categoryId,
        })),
        transfers: [],
        allocations: [],
      },
    });

  const restore = async (settingsPage: SettingsPage, contents: string) => {
    await settingsPage.pickFileAndConfirm('Load from backup', jsonFile(contents));
    await expect(settingsPage.statusMessage).toHaveText('Backup restored.');
  };

  test('export to CSV downloads a file named for today', async ({
    rootLayoutPage,
    settingsPage,
  }) => {
    await rootLayoutPage.navButton('Settings').click();
    const download = await settingsPage.downloadFromAction('Export to CSV');

    expect(download.suggestedFilename()).toMatch(/^jars-export-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(download.suggestedFilename()).toBe(`jars-export-${todayInUTC()}.csv`);
  });

  test('an empty database exports a file with nothing but the header', async ({
    rootLayoutPage,
    settingsPage,
  }) => {
    await rootLayoutPage.navButton('Settings').click();
    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    expect(csvLines(contents)).toEqual([header, '']);
  });

  test('every movement is exported with its kind, its values and named references', async ({
    createDefaultData,
    createAccount,
    createJar,
    createTransaction,
    createTransfer,
    createAllocation,
    rootLayoutPage,
    settingsPage,
  }) => {
    test.slow();

    const secondAccountName = 'Savings';
    const secondJarName = 'Holidays';

    await createDefaultData();
    await createAccount(secondAccountName);
    await createJar(secondJarName);
    // Distinct dates, so the order the file is written in is the newest-first order of the
    // movements list rather than an accident of how the kinds are gathered.
    await createTransaction({
      amount: '10000',
      date: '2026-02-10T09:00',
      description: 'Exported income',
      type: 'Income',
      accountName: defaultData.accounts[0],
      jarName: defaultData.jars[0],
      categoryName: defaultData.incomeCategories[0],
    });
    await createTransfer({
      amount: '2000',
      date: '2026-02-11T10:30',
      description: 'Exported transfer',
      originAccountName: defaultData.accounts[0],
      destinationAccountName: secondAccountName,
    });
    await createAllocation({
      amount: '3000.50',
      date: '2026-02-12T11:45',
      description: 'Exported allocation',
      originJarName: defaultData.jars[0],
      destinationJarName: secondJarName,
    });

    await rootLayoutPage.navButton('Settings').click();
    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    // Hardcoded for the hardcoded amounts and dates above: a plain decimal number beside its
    // currency, a `YYYY-MM-DD HH:mm` date, and every reference by name.
    expect(csvLines(contents)).toEqual([
      header,
      'Allocation,2026-02-12 11:45,Exported allocation,3000.50,CLP,,,,,,Monthly expenses,Holidays',
      'Transfer,2026-02-11 10:30,Exported transfer,2000,CLP,,,,Wallet,Savings,,',
      'Income,2026-02-10 09:00,Exported income,10000,CLP,Wallet,Salary,Monthly expenses,,,,',
      '',
    ]);
  });

  test('no internal representation reaches the file', async ({
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
      description: 'Exported transaction',
      type: 'Expense',
      accountName: defaultData.accounts[0],
      jarName: defaultData.jars[0],
      categoryName: defaultData.expenseCategories[0],
    });

    await rootLayoutPage.navButton('Settings').click();
    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    expect(contents).toContain('2026-02-10 09:00');
    expect(contents).toContain('1234.56');
    // No stored timestamp, no stored decimal, and no id of anything.
    expect(contents).not.toContain('2026-02-10T09:00:00.000Z');
    expect(contents).not.toContain('decimalPlaces');
    expect(contents).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  });

  test('an account, jar or category no movement references is absent, archived or not', async ({
    createDefaultData,
    createJar,
    createCategory,
    createTransaction,
    deleteJar,
    deleteCategory,
    rootLayoutPage,
    settingsPage,
  }) => {
    test.slow();

    const unusedJarName = 'Unused jar';
    const unusedCategoryName = 'Unused category';

    await createDefaultData();
    await createJar(unusedJarName);
    await createCategory('Expense', unusedCategoryName);
    await createTransaction({
      description: 'Exported transaction',
      type: 'Expense',
      accountName: defaultData.accounts[0],
      jarName: defaultData.jars[0],
      categoryName: defaultData.expenseCategories[0],
    });

    await rootLayoutPage.navButton('Settings').click();
    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    expect(contents).not.toContain(unusedJarName);
    expect(contents).not.toContain(unusedCategoryName);

    await deleteJar(unusedJarName);
    await deleteCategory('Expense', unusedCategoryName);

    await rootLayoutPage.navButton('Settings').click();
    const contentsAfterArchiving = await settingsPage.downloadContentsFromAction('Export to CSV');

    expect(contentsAfterArchiving).not.toContain(unusedJarName);
    expect(contentsAfterArchiving).not.toContain(unusedCategoryName);
  });

  test('a movement that references an archived entity still names it', async ({
    createDefaultData,
    createTransaction,
    deleteCategory,
    rootLayoutPage,
    settingsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({
      description: 'Exported transaction',
      type: 'Expense',
      accountName: defaultData.accounts[0],
      jarName: defaultData.jars[0],
      categoryName: defaultData.expenseCategories[0],
    });
    await deleteCategory('Expense', defaultData.expenseCategories[0]);

    await rootLayoutPage.navButton('Settings').click();
    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    expect(contents).toContain(`Exported transaction,`);
    expect(contents).toContain(`,${defaultData.expenseCategories[0]},`);
  });

  test('values containing separators or quotes are escaped', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
  }) => {
    test.slow();

    // A description is a single-line field, so a line break cannot be typed into one; the
    // test below reaches that case through a restored backup instead.
    const description = 'Lunch, "the good one"';

    await createDefaultData();
    await createTransaction({
      amount: '1000',
      date: '2026-02-10T09:00',
      description,
      type: 'Expense',
      accountName: defaultData.accounts[0],
      jarName: defaultData.jars[0],
      categoryName: defaultData.expenseCategories[0],
    });

    await rootLayoutPage.navButton('Settings').click();
    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    expect(csvLines(contents)).toEqual([
      header,
      'Expense,2026-02-10 09:00,"Lunch, ""the good one""",1000,CLP,Wallet,Groceries,' +
        'Monthly expenses,,,,',
      '',
    ]);
  });

  test('a value containing a line break is escaped', async ({ rootLayoutPage, settingsPage }) => {
    await rootLayoutPage.navButton('Settings').click();
    await restore(
      settingsPage,
      backupWith([
        {
          description: 'Lunch\nwith friends',
          amountDecimal: { value: '1000', decimalPlaces: 0 },
        },
      ])
    );

    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    // Quoted, and the break inside it does not end the record: splitting the file on its record
    // separator still yields one row.
    expect(csvLines(contents)).toEqual([
      header,
      'Expense,2026-02-10 09:00,"Lunch\nwith friends",1000,CLP,Wallet,Groceries,' +
        'Monthly expenses,,,,',
      '',
    ]);
  });

  test('amounts are written exactly as they are stored', async ({
    rootLayoutPage,
    settingsPage,
  }) => {
    // Each case is [description, what the database holds, what the file must say]. The stored
    // forms are the ones arithmetic and imports produce - scaled by negative decimal places,
    // signed, zero-padded - and the written forms are hardcoded.
    const amounts: [string, { value: string; decimalPlaces: number }, string][] = [
      ['a whole number', { value: '1000', decimalPlaces: 0 }, '1000'],
      ['two decimal places', { value: '123456', decimalPlaces: 2 }, '1234.56'],
      ['fewer digits than places', { value: '5', decimalPlaces: 2 }, '0.05'],
      ['trailing zeros', { value: '100', decimalPlaces: 2 }, '1.00'],
      ['negative decimal places', { value: '1', decimalPlaces: -2 }, '100'],
      ['a negative value scaled up', { value: '-25', decimalPlaces: -1 }, '-250'],
      ['a negative fraction', { value: '-12345', decimalPlaces: 3 }, '-12.345'],
      ['a signed zero', { value: '-0', decimalPlaces: 2 }, '0.00'],
      ['leading zeros', { value: '0100', decimalPlaces: 0 }, '100'],
      [
        'more digits than a float holds',
        { value: '10000000000000001', decimalPlaces: 1 },
        '1000000000000000.1',
      ],
    ];

    await rootLayoutPage.navButton('Settings').click();
    await restore(
      settingsPage,
      backupWith(amounts.map(([description, amountDecimal]) => ({ description, amountDecimal })))
    );

    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    amounts.forEach(([description, , written]) => {
      expect(contents).toContain(`,${description},${written},CLP,`);
    });
  });

  test('an exported CSV is not accepted by load from backup', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'Survives the rejected export' });

    await rootLayoutPage.navButton('Settings').click();
    const contents = await settingsPage.downloadContentsFromAction('Export to CSV');

    await settingsPage.pickFileAndConfirm('Load from backup', csvFile(contents));
    await expect(settingsPage.statusMessage).toHaveText('The file is not valid JSON.');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('Survives the rejected export');
  });

  test('exporting leaves the data untouched', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'Survives the export' });

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.downloadFromAction('Export to CSV');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('Survives the export');
  });
});

test.describe('clear all data', () => {
  test('cancelling the confirmation leaves all data in place', async ({
    createDefaultData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
    accountsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'Survives the cancelled clear' });

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.actionButton('Clear all data').click();

    await expect(settingsPage.confirmDialog('Clear all data')).toContainText(
      'All current data is permanently lost and cannot be recovered.'
    );
    await settingsPage.cancelButton('Clear all data').click();
    await expect(settingsPage.confirmDialog('Clear all data')).toBeHidden();

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToExist('Survives the cancelled clear');
    await rootLayoutPage.navButton('Accounts').click();
    await accountsPage.expectAccountToExist(defaultData.accounts[0]);
  });

  test('confirming the clear empties the database', async ({
    createDefaultData,
    createAccount,
    createJar,
    createTransaction,
    createTransfer,
    createAllocation,
    rootLayoutPage,
    settingsPage,
    movementsPage,
    accountsPage,
    jarsPage,
    categoriesPage,
  }) => {
    const secondAccountName = 'Savings';
    const secondJarName = 'Holidays';

    test.slow();

    await createDefaultData();
    await createAccount(secondAccountName);
    await createJar(secondJarName);
    await createTransaction({ description: 'Cleared transaction' });
    await createTransfer({
      description: 'Cleared transfer',
      originAccountName: defaultData.accounts[0],
      destinationAccountName: secondAccountName,
    });
    await createAllocation({
      description: 'Cleared allocation',
      originJarName: defaultData.jars[0],
      destinationJarName: secondJarName,
    });

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.clickActionAndConfirm('Clear all data');
    await expect(settingsPage.statusMessage).toHaveText('All data cleared.');

    // No reload: every list has to come back from a database that was emptied under it.
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToNotExist('Cleared transaction');
    await movementsPage.expectMovementToNotExist('Cleared transfer');
    await movementsPage.expectMovementToNotExist('Cleared allocation');

    await rootLayoutPage.navButton('Accounts').click();
    await accountsPage.expectAccountToNotExist(defaultData.accounts[0]);
    await accountsPage.expectAccountToNotExist(secondAccountName);

    await rootLayoutPage.navButton('Jars').click();
    await jarsPage.expectJarToNotExist(defaultData.jars[0]);
    await jarsPage.expectJarToNotExist(secondJarName);

    await rootLayoutPage.navButton('Categories').click();
    await categoriesPage.incomeTabButton.click();
    await categoriesPage.expectCategoryToNotExist(defaultData.incomeCategories[0]);
    await categoriesPage.expensesTabButton.click();
    await categoriesPage.expectCategoryToNotExist(defaultData.expenseCategories[0]);
  });

  test('the cleared database stays empty across a reload', async ({
    createDefaultData,
    createTransaction,
    page,
    rootLayoutPage,
    settingsPage,
    movementsPage,
    accountsPage,
  }) => {
    test.slow();

    await createDefaultData();
    await createTransaction({ description: 'Cleared before the reload' });

    await rootLayoutPage.navButton('Settings').click();
    await settingsPage.clickActionAndConfirm('Clear all data');
    await expect(settingsPage.statusMessage).toHaveText('All data cleared.');

    await page.reload();
    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.expectMovementToNotExist('Cleared before the reload');
    await rootLayoutPage.navButton('Accounts').click();
    await accountsPage.expectAccountToNotExist(defaultData.accounts[0]);
  });
});
