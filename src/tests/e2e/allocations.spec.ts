import { expect } from '@playwright/test';
import { DEFAULT_MOVEMENT_DATE, test } from './setup';
import { runInOrder } from 'src/lib/utils';

// Pin locale/timezone so the expected rendered strings below are deterministic
// and can be asserted as literals rather than recomputed from app code.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

test('can create an allocation, focus flowing from one field to the next', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
  page,
}) => {
  const originName = 'Holidays';
  const destinationName = 'Emergency';
  const description = 'Trip savings';
  const amount = '150000';
  const date = '2026-05-20T15:20';

  await seedData({ jars: [originName, destinationName] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createAllocationButton.click();

  // The origin jar selector opens on its own
  await expect(page.getByRole('option', { name: originName, exact: true })).toBeVisible();
  await page.getByRole('option', { name: originName, exact: true }).click();

  // Picking the origin jar opens the destination jar selector
  await expect(page.getByRole('option', { name: destinationName, exact: true })).toBeVisible();
  await page.getByRole('option', { name: destinationName, exact: true }).click();

  // Picking the destination jar moves focus to the amount field
  await expect(allocationFormPage.amountInput).toBeFocused();
  await allocationFormPage.amountInput.fill(amount);

  // Enter on the amount field moves focus to the description field
  await allocationFormPage.amountInput.press('Enter');
  await expect(allocationFormPage.descriptionInput).toBeFocused();
  await allocationFormPage.descriptionInput.fill(description);

  await allocationFormPage.fillDate(date);
  await allocationFormPage.submitButton.click();

  // Wait for the movements page to load
  await expect(movementsPage.createAllocationButton).toBeVisible();

  // Check the allocation was created correctly. Expected strings are hardcoded for the
  // hardcoded inputs above (amount '150000' -> CLP, date '2026-05-20T15:20' -> UTC).
  const allocationLink = movementsPage.getMovement(description);
  await expect(allocationLink).toBeVisible();
  await expect(allocationLink.getByText(`${originName} → ${destinationName}`)).toBeVisible();
  await expect(allocationLink.getByText('$150,000')).toBeVisible();
  await expect(allocationLink.getByText('5/20/2026, 3:20:00 PM')).toBeVisible();
});

test('allocation form defaults, jar options and validation', async ({
  seedData,
  deleteJar,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
  page,
}) => {
  const originName = 'Origin jar name';
  const destinationName = 'Destination jar name';
  const archivedName = 'Archived jar';
  const description = 'Zero allocation';

  await seedData({ jars: [originName, destinationName, { name: archivedName, archived: true }] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createAllocationButton.click();

  // Date field is prefilled with today (UTC, per test.use above) in datetime-local format
  const today = new Date().toISOString().slice(0, 10);
  await expect(allocationFormPage.dateInput).toHaveValue(new RegExp(`^${today}T\\d{2}:\\d{2}$`));

  // Submitting an empty form reports every required field
  await allocationFormPage.submitButton.click();
  await runInOrder(
    ['Origin jar is required', 'Destination jar is required', 'Amount is required'].map(
      (message) => async () => {
        await expect(page.getByText(message)).toBeVisible();
      }
    )
  );

  // Only active jars are selectable
  await allocationFormPage.expectOptionToExist('Origin jar', originName);
  await allocationFormPage.expectOptionToNotExist('Origin jar', archivedName);
  await allocationFormPage.expectOptionToNotExist('Destination jar', archivedName);

  // Picking an origin jar removes it from the destination options...
  await allocationFormPage.selectOriginJar(originName);
  await allocationFormPage.expectOptionToNotExist('Destination jar', originName);
  await allocationFormPage.expectOptionToExist('Destination jar', destinationName);

  // ...and picking a destination jar removes it from the origin options. Between the two,
  // origin and destination can never be made equal through the UI.
  await allocationFormPage.selectDestinationJar(destinationName);
  await allocationFormPage.expectOptionToNotExist('Origin jar', destinationName);
  await allocationFormPage.expectOptionToExist('Origin jar', originName);

  // The amount only takes digits, so letters and a minus sign never reach it
  await allocationFormPage.fillAmount('asdf');
  await expect(allocationFormPage.amountInput).toHaveValue('');

  await allocationFormPage.fillAmount('-1');
  await expect(allocationFormPage.amountInput).toHaveValue('$1');

  // Zero is accepted, so the form submits and the allocation shows up on the movements page
  await allocationFormPage.fillAmount('0');
  await allocationFormPage.fillDescription(description);
  await allocationFormPage.submitButton.click();

  await expect(movementsPage.createAllocationButton).toBeVisible();
  await expect(page.getByText('Amount must be a non-negative number')).toBeHidden();
  const allocationLink = movementsPage.getMovement(description);
  await expect(allocationLink).toBeVisible();
  await expect(allocationLink.getByText(`${originName} → ${destinationName}`)).toBeVisible();
  await expect(allocationLink.getByText('$0', { exact: true })).toBeVisible();

  // The zero amount left both jar balances at zero, so both jars can still be archived
  await deleteJar(originName);
  await deleteJar(destinationName);

  // Editing the allocation still offers the archived jars it references
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement(description).click();
  await allocationFormPage.expectOptionToExist('Origin jar', originName);
  await allocationFormPage.expectOptionToExist('Destination jar', destinationName);
});

test('can edit an allocation', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
  page,
}) => {
  // Initial data
  const initialOriginName = 'Initial origin jar';
  const initialDestinationName = 'Initial destination jar';
  const initialDescription = 'Initial allocation';
  const initialAmount = '150000';
  // In the current month, so the list opens on it.
  const initialDate = DEFAULT_MOVEMENT_DATE;

  // New data (every field will change)
  const newOriginName = 'New origin jar';
  const newDestinationName = 'New destination jar';
  const newDescription = 'Edited allocation';
  const newAmount = '275000';
  const newDate = '2026-07-11T08:45';

  await seedData({
    jars: [initialOriginName, initialDestinationName, newOriginName, newDestinationName],
    allocations: [
      {
        amount: initialAmount,
        date: initialDate,
        description: initialDescription,
        originJarName: initialOriginName,
        destinationJarName: initialDestinationName,
      },
    ],
  });

  // Open the initial allocation's edit form
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement(initialDescription).click();

  // The form is populated with the allocation's current values
  await expect(allocationFormPage.dateInput).toHaveValue(initialDate);
  await expect(allocationFormPage.originJarSelect).toContainText(initialOriginName);
  await expect(allocationFormPage.destinationJarSelect).toContainText(initialDestinationName);
  await expect(allocationFormPage.amountInput).toHaveValue('$150,000');
  await expect(allocationFormPage.descriptionInput).toHaveValue(initialDescription);

  // Change every field of the allocation
  await allocationFormPage.fillDate(newDate);
  await allocationFormPage.selectOriginJar(newOriginName);
  await allocationFormPage.selectDestinationJar(newDestinationName);
  await allocationFormPage.fillAmount(newAmount);
  await allocationFormPage.fillDescription(newDescription);
  await allocationFormPage.submitButton.click();

  // Verify the allocation now shows the new values on the movements page. Expected strings are
  // hardcoded for the hardcoded inputs above (amount '275000' -> CLP, '2026-07-11T08:45' -> UTC).
  await expect(movementsPage.createAllocationButton).toBeVisible();
  const allocationLink = movementsPage.getMovement(newDescription);
  await expect(allocationLink).toBeVisible();
  await expect(allocationLink.getByText(`${newOriginName} → ${newDestinationName}`)).toBeVisible();
  await expect(allocationLink.getByText('$275,000')).toBeVisible();
  await expect(allocationLink.getByText('7/11/2026, 8:45:00 AM')).toBeVisible();
  await expect(page.getByText(initialDescription)).toBeHidden();
});

test('can delete an allocation', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
}) => {
  const originName = 'Deletable origin jar';
  const destinationName = 'Deletable destination jar';
  const description = 'Allocation to delete';

  await seedData({
    jars: [originName, destinationName],
    allocations: [{ description, originJarName: originName, destinationJarName: destinationName }],
  });

  // Verify the allocation exists, then open its edit form
  await rootLayoutPage.navButton('Movements').click();
  await expect(movementsPage.getMovement(description)).toBeVisible();
  await movementsPage.getMovement(description).click();

  await allocationFormPage.deleteButton.click();

  // Verify the allocation no longer exists on the movements page
  await expect(movementsPage.createAllocationButton).toBeVisible();
  await expect(movementsPage.getMovement(description)).toBeHidden();
});

test('after editing an allocation, it automatically restores archived jars if their balance is no longer zero', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
  jarsPage,
}) => {
  const originName = 'Restorable origin jar';
  const destinationName = 'Restorable destination jar';
  const description = 'Allocation that revives its jars';

  // Archived, as deleting them leaves them. A zero amount keeps both jar balances at zero, which
  // deleting them requires.
  await seedData({
    jars: [
      { name: originName, archived: true },
      { name: destinationName, archived: true },
    ],
    allocations: [
      { amount: '0', description, originJarName: originName, destinationJarName: destinationName },
    ],
  });

  // Ensure they no longer exist
  await rootLayoutPage.navButton('Jars').click();
  await expect(jarsPage.createJarButton).toBeVisible();
  await jarsPage.expectJarToNotExist(originName);
  await jarsPage.expectJarToNotExist(destinationName);

  // Giving the allocation a non-zero amount leaves both archived jars holding money
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement(description).click();
  await allocationFormPage.fillAmount('5000');
  await allocationFormPage.submitButton.click();

  // So both jars should exist again
  await expect(movementsPage.createAllocationButton).toBeVisible();
  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.expectJarToExist(originName);
  await jarsPage.expectJarToExist(destinationName);
});

test('allocation form jar selectors are ordered alphabetically', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
}) => {
  // Seeded out of alphabetical order, so the order the selectors offer cannot be the seeded
  // order.
  await seedData({ jars: ['Travel', 'Emergency', 'Rent'] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createAllocationButton.click();

  const orderedNames = ['Emergency', 'Rent', 'Travel'];
  await allocationFormPage.expectOptionsInOrder('Origin jar', orderedNames);
  await allocationFormPage.expectOptionsInOrder('Destination jar', orderedNames);
});
