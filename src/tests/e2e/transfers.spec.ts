import { expect } from '@playwright/test';
import { test } from './setup';
import { runInOrder } from 'src/lib/utils';

// Pin locale/timezone so the expected rendered strings below are deterministic
// and can be asserted as literals rather than recomputed from app code.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

test('can create a transfer', async ({
  createAccount,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
  page,
}) => {
  test.slow();
  const originName = 'Checking';
  const destinationName = 'Vault';
  const description = 'Rent buffer';
  const amount = '150000';
  const date = '2026-05-20T15:20';

  await createAccount(originName);
  await createAccount(destinationName);

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransferButton.click();

  await transferFormPage.fillDate(date);
  await transferFormPage.selectOriginAccount(originName);
  await transferFormPage.selectDestinationAccount(destinationName);
  await transferFormPage.fillAmount(amount);
  await transferFormPage.fillDescription(description);
  await transferFormPage.submitButton.click();

  // Wait for the movements page to load
  await expect(movementsPage.createTransferButton).toBeVisible();

  // Check the transfer was created correctly. Expected strings are hardcoded for the
  // hardcoded inputs above (amount '150000' -> CLP, date '2026-05-20T15:20' -> UTC).
  await expect(page.getByText(description)).toBeVisible();
  await expect(page.getByText(`${originName} → ${destinationName}`)).toBeVisible();
  await expect(page.getByText('$150.000')).toBeVisible();
  await expect(page.getByText('5/20/2026, 3:20:00 PM')).toBeVisible();
});

test('transfer date defaults to today', async ({
  rootLayoutPage,
  movementsPage,
  transferFormPage,
}) => {
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransferButton.click();

  // Date field is prefilled with today (UTC, per test.use above) in datetime-local format
  const today = new Date().toISOString().slice(0, 10);
  await expect(transferFormPage.dateInput).toHaveValue(new RegExp(`^${today}T\\d{2}:\\d{2}$`));
});

test.describe('transfer form validation', () => {
  test('required fields', async ({
    createAccount,
    rootLayoutPage,
    movementsPage,
    transferFormPage,
    page,
  }) => {
    await createAccount('Some account');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransferButton.click();

    await transferFormPage.submitButton.click();
    await runInOrder(
      ['Origin account is required', 'Destination account is required', 'Amount is required'].map(
        (message) => async () => {
          await expect(page.getByText(message)).toBeVisible();
        }
      )
    );
  });

  test('amount must be a non-negative number', async ({
    createAccount,
    rootLayoutPage,
    movementsPage,
    transferFormPage,
    page,
  }) => {
    test.slow();
    await createAccount('Origin acc');
    await createAccount('Destination acc');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransferButton.click();

    await transferFormPage.selectOriginAccount('Origin acc');
    await transferFormPage.selectDestinationAccount('Destination acc');

    await transferFormPage.fillAmount('asdf');
    await transferFormPage.submitButton.click();
    await expect(page.getByText('Amount must be a non-negative number')).toBeVisible();

    await transferFormPage.fillAmount('-1');
    await transferFormPage.submitButton.click();
    await expect(page.getByText('Amount must be a non-negative number')).toBeVisible();
  });

  test('amount can be zero', async ({
    createAccount,
    rootLayoutPage,
    movementsPage,
    transferFormPage,
    page,
  }) => {
    test.slow();
    const description = 'Zero transfer';
    await createAccount('Origin acc');
    await createAccount('Destination acc');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransferButton.click();

    await transferFormPage.selectOriginAccount('Origin acc');
    await transferFormPage.selectDestinationAccount('Destination acc');
    await transferFormPage.fillAmount('0');
    await transferFormPage.fillDescription(description);
    await transferFormPage.submitButton.click();

    await expect(movementsPage.createTransferButton).toBeVisible();
    await expect(page.getByText('Amount must be a non-negative number')).toBeHidden();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByText('Origin acc → Destination acc')).toBeVisible();
    await expect(page.getByText('$0', { exact: true })).toBeVisible();
  });

  test('a selected account is not offered in the other selector', async ({
    createAccount,
    rootLayoutPage,
    movementsPage,
    transferFormPage,
  }) => {
    test.slow();
    const firstName = 'First account';
    const secondName = 'Second account';
    await createAccount(firstName);
    await createAccount(secondName);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransferButton.click();

    // Picking an origin account removes it from the destination options...
    await transferFormPage.selectOriginAccount(firstName);
    await transferFormPage.expectOptionToNotExist('Destination account', firstName);
    await transferFormPage.expectOptionToExist('Destination account', secondName);

    // ...and picking a destination account removes it from the origin options.
    await transferFormPage.selectDestinationAccount(secondName);
    await transferFormPage.expectOptionToNotExist('Origin account', secondName);
    await transferFormPage.expectOptionToExist('Origin account', firstName);
  });

  test('only active accounts are selectable', async ({
    createAccount,
    deleteAccount,
    rootLayoutPage,
    movementsPage,
    transferFormPage,
  }) => {
    test.slow();
    const activeName = 'Active account';
    const archivedName = 'Archived account';
    await createAccount(activeName);
    await createAccount(archivedName);
    await deleteAccount(archivedName);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createTransferButton.click();

    await transferFormPage.expectOptionToExist('Origin account', activeName);
    await transferFormPage.expectOptionToNotExist('Origin account', archivedName);
    await transferFormPage.expectOptionToNotExist('Destination account', archivedName);
  });
});
