import { expect } from '@playwright/test';
import { DEFAULT_MOVEMENT_DATE, test } from './setup';
import { runInOrder } from 'src/lib/utils';

// Pin locale/timezone so the expected rendered strings below are deterministic
// and can be asserted as literals rather than recomputed from app code.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

test('can create a transfer, focus flowing from one field to the next', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
  page,
}) => {
  const originName = 'Checking';
  const destinationName = 'Vault';
  const description = 'Rent buffer';
  const amount = '150000';
  const date = '2026-05-20T15:20';

  await seedData({ accounts: [originName, destinationName] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransferButton.click();

  // The origin account selector opens on its own
  await expect(page.getByRole('option', { name: originName, exact: true })).toBeVisible();
  await page.getByRole('option', { name: originName, exact: true }).click();

  // Picking the origin account opens the destination account selector
  await expect(page.getByRole('option', { name: destinationName, exact: true })).toBeVisible();
  await page.getByRole('option', { name: destinationName, exact: true }).click();

  // Picking the destination account moves focus to the amount field
  await expect(transferFormPage.amountInput).toBeFocused();
  await transferFormPage.amountInput.fill(amount);

  // Enter on the amount field moves focus to the description field
  await transferFormPage.amountInput.press('Enter');
  await expect(transferFormPage.descriptionInput).toBeFocused();
  await transferFormPage.descriptionInput.fill(description);

  await transferFormPage.fillDate(date);
  await transferFormPage.submitButton.click();

  // Wait for the movements page to load
  await expect(movementsPage.createTransferButton).toBeVisible();

  // Check the transfer was created correctly. Expected strings are hardcoded for the
  // hardcoded inputs above (amount '150000' -> CLP, date '2026-05-20T15:20' -> UTC).
  await expect(page.getByText(description)).toBeVisible();
  await expect(page.getByText(`${originName} → ${destinationName}`)).toBeVisible();
  await expect(page.getByText('$150,000')).toBeVisible();
  await expect(page.getByText('5/20/2026, 3:20:00 PM')).toBeVisible();
});

test('transfer form defaults, account options and validation', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
  page,
}) => {
  test.slow();
  const originName = 'Origin acc';
  const destinationName = 'Destination acc';
  const archivedName = 'Archived account';
  const description = 'Zero transfer';

  await seedData({
    accounts: [originName, destinationName, { name: archivedName, archived: true }],
  });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransferButton.click();

  // Date field is prefilled with today (UTC, per test.use above) in datetime-local format
  const today = new Date().toISOString().slice(0, 10);
  await expect(transferFormPage.dateInput).toHaveValue(new RegExp(`^${today}T\\d{2}:\\d{2}$`));

  // Submitting an empty form reports every required field
  await transferFormPage.submitButton.click();
  await runInOrder(
    ['Origin account is required', 'Destination account is required', 'Amount is required'].map(
      (message) => async () => {
        await expect(page.getByText(message)).toBeVisible();
      }
    )
  );

  // Only active accounts are selectable
  await transferFormPage.expectOptionToExist('Origin account', originName);
  await transferFormPage.expectOptionToNotExist('Origin account', archivedName);
  await transferFormPage.expectOptionToNotExist('Destination account', archivedName);

  // Picking an origin account removes it from the destination options...
  await transferFormPage.selectOriginAccount(originName);
  await transferFormPage.expectOptionToNotExist('Destination account', originName);
  await transferFormPage.expectOptionToExist('Destination account', destinationName);

  // ...and picking a destination account removes it from the origin options.
  await transferFormPage.selectDestinationAccount(destinationName);
  await transferFormPage.expectOptionToNotExist('Origin account', destinationName);
  await transferFormPage.expectOptionToExist('Origin account', originName);

  // The amount only takes digits, so letters and a minus sign never reach it
  await transferFormPage.fillAmount('asdf');
  await expect(transferFormPage.amountInput).toHaveValue('');

  await transferFormPage.fillAmount('-1');
  await expect(transferFormPage.amountInput).toHaveValue('$1');

  // Zero is accepted, so the form submits and the transfer shows up on the movements page
  await transferFormPage.fillAmount('0');
  await transferFormPage.fillDescription(description);
  await transferFormPage.submitButton.click();

  await expect(movementsPage.createTransferButton).toBeVisible();
  await expect(page.getByText('Amount must be a non-negative number')).toBeHidden();
  await expect(page.getByText(description)).toBeVisible();
  await expect(page.getByText(`${originName} → ${destinationName}`)).toBeVisible();
  await expect(page.getByText('$0', { exact: true })).toBeVisible();
});

test('can edit a transfer', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
  page,
}) => {
  // Initial data
  const initialOriginName = 'Initial origin';
  const initialDestinationName = 'Initial destination';
  const initialDescription = 'Initial transfer';
  const initialAmount = '150000';
  // In the current month, so the list opens on it.
  const initialDate = DEFAULT_MOVEMENT_DATE;

  // New data (every field will change)
  const newOriginName = 'New origin';
  const newDestinationName = 'New destination';
  const newDescription = 'Edited transfer';
  const newAmount = '275000';
  const newDate = '2026-07-11T08:45';

  await seedData({
    accounts: [initialOriginName, initialDestinationName, newOriginName, newDestinationName],
    jars: ['Monthly expenses', 'Travel'],
    transfers: [
      {
        amount: initialAmount,
        date: initialDate,
        description: initialDescription,
        originAccountName: initialOriginName,
        destinationAccountName: initialDestinationName,
      },
      // Only here for the description suggestions, so dated in a month the list does not open on.
      ...[
        { description: 'Top up', date: '2026-03-01T10:00' },
        { description: 'Rebalance', date: '2026-03-05T10:00' },
        { description: 'Top up', date: '2026-03-09T10:00' },
        { description: '', date: '2026-03-10T10:00' },
        { description: 'Deleted transfer', date: '2026-03-11T10:00', archived: true },
      ].map((transfer) => ({
        ...transfer,
        originAccountName: initialOriginName,
        destinationAccountName: initialDestinationName,
      })),
    ],
    allocations: [
      {
        description: 'Holiday fund',
        date: '2026-03-12T10:00',
        originJarName: 'Monthly expenses',
        destinationJarName: 'Travel',
      },
    ],
  });

  // Open the initial transfer's edit form
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement(initialDescription).click();

  // The form is populated with the transfer's current values
  await expect(transferFormPage.dateInput).toHaveValue(initialDate);
  await expect(transferFormPage.originAccountSelect).toContainText(initialOriginName);
  await expect(transferFormPage.destinationAccountSelect).toContainText(initialDestinationName);
  await expect(transferFormPage.amountInput).toHaveValue('$150,000');
  await expect(transferFormPage.descriptionInput).toHaveValue(initialDescription);

  // The description field suggests every transfer description once, the latest first. Deleted
  // transfers, blank descriptions and other movements' descriptions are not among them.
  await transferFormPage.expectDescriptionSuggestions([initialDescription, 'Top up', 'Rebalance']);

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
  await expect(transferLink.getByText('$275,000')).toBeVisible();
  await expect(transferLink.getByText('7/11/2026, 8:45:00 AM')).toBeVisible();
  await expect(page.getByText(initialDescription)).toBeHidden();
});

test('can delete a transfer', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
}) => {
  const originName = 'Deletable origin';
  const destinationName = 'Deletable destination';
  const description = 'Transfer to delete';

  await seedData({
    accounts: [originName, destinationName],
    transfers: [
      { description, originAccountName: originName, destinationAccountName: destinationName },
    ],
  });

  // Verify the transfer exists, then open its edit form
  await rootLayoutPage.navButton('Movements').click();
  await expect(movementsPage.getMovement(description)).toBeVisible();
  await movementsPage.getMovement(description).click();

  await transferFormPage.deleteButton.click();

  // Verify the transfer no longer exists on the movements page
  await expect(movementsPage.createTransferButton).toBeVisible();
  await expect(movementsPage.getMovement(description)).toBeHidden();
});

test('when editing a transfer, selectors include archived accounts that the transfer references, and editing restores them once their balance is no longer zero', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
  accountsPage,
}) => {
  const originName = 'Archived origin account';
  const destinationName = 'Archived destination account';
  const description = 'Transfer between archived accounts';

  // Archived, as deleting them leaves them. A zero amount keeps both account balances at zero,
  // which deleting them requires.
  await seedData({
    accounts: [
      { name: originName, archived: true },
      { name: destinationName, archived: true },
    ],
    transfers: [
      {
        amount: '0',
        description,
        originAccountName: originName,
        destinationAccountName: destinationName,
      },
    ],
  });

  // Ensure they no longer exist
  await rootLayoutPage.navButton('Accounts').click();
  await expect(accountsPage.createAccountButton).toBeVisible();
  await accountsPage.expectAccountToNotExist(originName);
  await accountsPage.expectAccountToNotExist(destinationName);

  // Open the edit form for the transfer that references the archived accounts
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement(description).click();

  // The archived accounts are still offered because the transfer references them
  await transferFormPage.expectOptionToExist('Origin account', originName);
  await transferFormPage.expectOptionToExist('Destination account', destinationName);

  // Giving the transfer a non-zero amount leaves both archived accounts holding money
  await transferFormPage.fillAmount('5000');
  await transferFormPage.submitButton.click();

  // So both accounts should exist again
  await expect(movementsPage.createTransferButton).toBeVisible();
  await rootLayoutPage.navButton('Accounts').click();
  await accountsPage.expectAccountToExist(originName);
  await accountsPage.expectAccountToExist(destinationName);
});

test('transfer form account selectors are ordered alphabetically', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
}) => {
  // Seeded out of alphabetical order, so the order the selectors offer cannot be the seeded
  // order.
  await seedData({ accounts: ['Wallet', 'Bank', 'Mattress'] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createTransferButton.click();

  const orderedNames = ['Bank', 'Mattress', 'Wallet'];
  await transferFormPage.expectOptionsInOrder('Origin account', orderedNames);
  await transferFormPage.expectOptionsInOrder('Destination account', orderedNames);
});
