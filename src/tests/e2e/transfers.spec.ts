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

test('can edit a transfer', async ({
  createAccount,
  createTransfer,
  movementsPage,
  transferFormPage,
  page,
}) => {
  test.slow();
  // Initial data
  const initialOriginName = 'Initial origin';
  const initialDestinationName = 'Initial destination';
  const initialDescription = 'Initial transfer';
  const initialAmount = '150000';
  const initialDate = '2026-06-15T10:00';

  // New data (every field will change)
  const newOriginName = 'New origin';
  const newDestinationName = 'New destination';
  const newDescription = 'Edited transfer';
  const newAmount = '275000';
  const newDate = '2026-07-11T08:45';

  await createAccount(initialOriginName);
  await createAccount(initialDestinationName);
  await createAccount(newOriginName);
  await createAccount(newDestinationName);

  await createTransfer({
    amount: initialAmount,
    date: initialDate,
    description: initialDescription,
    originAccountName: initialOriginName,
    destinationAccountName: initialDestinationName,
  });

  // Verify the initial transfer exists, then open its edit form
  await expect(movementsPage.createTransferButton).toBeVisible();
  await movementsPage.getMovement(initialDescription).click();

  // The form is populated with the transfer's current values
  await expect(transferFormPage.dateInput).toHaveValue(initialDate);
  await expect(transferFormPage.originAccountSelect).toContainText(initialOriginName);
  await expect(transferFormPage.destinationAccountSelect).toContainText(initialDestinationName);
  await expect(transferFormPage.amountInput).toHaveValue(initialAmount);
  await expect(transferFormPage.descriptionInput).toHaveValue(initialDescription);

  // Change every field of the transfer
  await transferFormPage.fillDate(newDate);
  await transferFormPage.selectOriginAccount(newOriginName);
  await transferFormPage.selectDestinationAccount(newDestinationName);
  await transferFormPage.fillAmount(newAmount);
  await transferFormPage.fillDescription(newDescription);
  await transferFormPage.submitButton.click();

  // Verify the transfer now shows the new values on the movements page. Expected strings are
  // hardcoded for the hardcoded inputs above (amount '275000' -> CLP, '2026-07-11T08:45' -> UTC).
  await expect(movementsPage.createTransferButton).toBeVisible();
  const transferLink = movementsPage.getMovement(newDescription);
  await expect(transferLink).toBeVisible();
  await expect(transferLink.getByText(`${newOriginName} → ${newDestinationName}`)).toBeVisible();
  await expect(transferLink.getByText('$275.000')).toBeVisible();
  await expect(transferLink.getByText('7/11/2026, 8:45:00 AM')).toBeVisible();
  await expect(page.getByText(initialDescription)).toBeHidden();
});

test('when editing a transfer, selectors include archived accounts that the transfer references', async ({
  createAccount,
  createTransfer,
  deleteAccount,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
}) => {
  test.slow();
  const originName = 'Archived origin account';
  const destinationName = 'Archived destination account';
  const description = 'Transfer between archived accounts';

  await createAccount(originName);
  await createAccount(destinationName);

  await createTransfer({
    description,
    originAccountName: originName,
    destinationAccountName: destinationName,
  });

  await expect(movementsPage.createTransferButton).toBeVisible();

  await deleteAccount(originName);
  await deleteAccount(destinationName);

  // Open the edit form for the transfer that references the archived accounts
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement(description).click();

  // The archived accounts are still offered because the transfer references them
  await transferFormPage.expectOptionToExist('Origin account', originName);
  await transferFormPage.expectOptionToExist('Destination account', destinationName);
});
