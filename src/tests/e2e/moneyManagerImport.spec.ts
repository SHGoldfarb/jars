import { expect } from '@playwright/test';
import { test, defaultData } from './setup';
import { moneyManagerSampleFile } from './fixtures/moneyManagerSample';
import type { SettingsPage } from './pages/settings.page';

// Pin locale/timezone so the expected rendered strings below are deterministic and can be
// asserted as literals rather than recomputed from app code.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

const ACTION = 'Import from Money Manager Excel';

// Every expected value below is hardcoded from the rows in `fixtures/moneyManagerSample.ts`.
const CASH_ACCOUNT = 'Cash';

const notASpreadsheet = {
  name: 'jars-backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(
    JSON.stringify({ schemaVersion: 3, createdAtISO: '2026-02-10T09:00:00.000Z', data: {} })
  ),
};

const importSample = async (settingsPage: SettingsPage) => {
  await settingsPage.pickFileAndConfirm(ACTION, await moneyManagerSampleFile());
  await expect(settingsPage.statusMessage).toHaveText('Money Manager file imported.');
};

test('a Money Manager export becomes jars, categories and movements under one Cash account', async ({
  rootLayoutPage,
  settingsPage,
  accountsPage,
  jarsPage,
  categoriesPage,
  movementsPage,
}) => {
  test.slow();

  await rootLayoutPage.navButton('Settings').click();
  await importSample(settingsPage);

  // Money Manager has no accounts in this app's sense, so the import invents exactly one.
  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.expectAccountToExist(CASH_ACCOUNT);
  await expect(accountsPage.getAccount('Wallet')).toBeHidden();

  // One jar per Money Manager account, however many rows name it.
  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.expectJarToExist('Wallet');
  await jarsPage.expectJarToExist('Holidays');

  // Categories carry the kind of the rows that used them, and the transfer rows contribute none.
  await rootLayoutPage.navButton('Categories').click();
  await categoriesPage.incomeTabButton.click();
  await categoriesPage.expectCategoryToExist('Salary');
  await categoriesPage.expectCategoryToNotExist('Groceries');
  await categoriesPage.expensesTabButton.click();
  await categoriesPage.expectCategoryToExist('Groceries');
  await categoriesPage.expectCategoryToNotExist('Salary');
  await categoriesPage.expectCategoryToNotExist('Transfer');

  // Hardcoded from the rows above: amounts and dates as the file writes them, the Money Manager
  // account as the jar, and `Cash` as the account.
  await rootLayoutPage.navButton('Movements').click();
  const income = movementsPage.getMovement('Monthly salary');
  await expect(income).toContainText(`${CASH_ACCOUNT} · Wallet`);
  await expect(income).toContainText('Salary');
  await expect(income).toContainText('$10.000');
  await expect(income).toContainText('2/10/2026, 9:00:00 AM');

  const expense = movementsPage.getMovement('Snacks');
  await expect(expense).toContainText(`${CASH_ACCOUNT} · Holidays`);
  await expect(expense).toContainText('Groceries');
  await expect(expense).toContainText('$500');
  await expect(expense).toContainText('2/13/2026, 8:15:00 AM');
});

test('transfer rows become a single allocation and no transfers', async ({
  rootLayoutPage,
  settingsPage,
  movementsPage,
}) => {
  test.slow();

  await rootLayoutPage.navButton('Settings').click();
  await importSample(settingsPage);

  await rootLayoutPage.navButton('Movements').click();

  // The file writes the transfer twice, once from each side; only one allocation comes out of it.
  const allocation = movementsPage.getMovement('Holiday saving');
  await expect(allocation).toHaveCount(1);
  await expect(allocation).toContainText('Wallet → Holidays');
  await expect(allocation).toContainText('$3.000');
  await expect(allocation).toContainText('2/12/2026, 11:45:00 AM');

  // Every movement lives in the one account, so nothing moved between accounts.
  await expect(movementsPage.movementKind('Transfer')).toBeHidden();
  await expect(movementsPage.movementKind('Allocation')).toBeVisible();
});

test('the imported account and jars show balances consistent with the movements', async ({
  rootLayoutPage,
  settingsPage,
  accountsPage,
  jarsPage,
}) => {
  test.slow();

  await rootLayoutPage.navButton('Settings').click();
  await importSample(settingsPage);

  // Hardcoded from the rows above: 10000 in, 2500 and 500 out, and allocations move nothing
  // between accounts.
  await rootLayoutPage.navButton('Accounts').click();
  await expect(accountsPage.getAccount(CASH_ACCOUNT)).toContainText('$7.000');

  // Wallet: 10000 in, 2500 out, 3000 allocated away. Holidays: 3000 in, 500 out.
  await rootLayoutPage.navButton('Jars').click();
  await expect(jarsPage.getJar('Wallet')).toContainText('$4.500');
  await expect(jarsPage.getJar('Holidays')).toContainText('$2.500');
});

test('the import replaces the current data rather than merging into it', async ({
  createDefaultData,
  createTransaction,
  rootLayoutPage,
  settingsPage,
  movementsPage,
  accountsPage,
}) => {
  test.slow();

  await createDefaultData();
  await createTransaction({ description: 'Created before the import' });

  await rootLayoutPage.navButton('Settings').click();
  await importSample(settingsPage);

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.expectMovementToNotExist('Created before the import');
  await movementsPage.expectMovementToExist('Monthly salary');

  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.expectAccountToNotExist(defaultData.accounts[0]);
});

test('the import is confirmed before anything is written', async ({
  createDefaultData,
  createTransaction,
  rootLayoutPage,
  settingsPage,
  movementsPage,
}) => {
  test.slow();

  await createDefaultData();
  await createTransaction({ description: 'Survives the cancelled import' });

  await rootLayoutPage.navButton('Settings').click();
  await settingsPage.pickFile(ACTION, await moneyManagerSampleFile());

  await expect(settingsPage.confirmDialog(ACTION)).toContainText(
    'This replaces all current data and it cannot be recovered.'
  );
  await settingsPage.cancelButton(ACTION).click();
  await expect(settingsPage.confirmDialog(ACTION)).toBeHidden();

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.expectMovementToExist('Survives the cancelled import');
  await movementsPage.expectMovementToNotExist('Monthly salary');
});

test('a file that is not a spreadsheet is rejected and changes nothing', async ({
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
  await settingsPage.pickFileAndConfirm(ACTION, notASpreadsheet);
  await expect(settingsPage.statusMessage).toHaveText(
    'The file could not be read as a spreadsheet.'
  );

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.expectMovementToExist('Survives the rejected file');
});

test('imported data appears without a manual refresh and survives a reload', async ({
  createDefaultData,
  createTransaction,
  page,
  rootLayoutPage,
  settingsPage,
  movementsPage,
}) => {
  test.slow();

  await createDefaultData();
  await createTransaction({ description: 'Replaced by the import' });

  await rootLayoutPage.navButton('Settings').click();
  await importSample(settingsPage);

  // No reload: the movements list has to come back from a database that was replaced under it.
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.expectMovementToExist('Monthly salary');
  await movementsPage.expectMovementToNotExist('Replaced by the import');

  await page.reload();
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.expectMovementToExist('Monthly salary');
  await movementsPage.expectMovementToNotExist('Replaced by the import');
});
