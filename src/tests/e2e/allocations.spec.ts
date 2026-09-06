import { expect } from '@playwright/test';
import { test } from './setup';
import { runInOrder } from 'src/lib/utils';

// Pin locale/timezone so the expected rendered strings below are deterministic
// and can be asserted as literals rather than recomputed from app code.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

test('can create an allocation', async ({
  createJar,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
}) => {
  test.slow();
  const originName = 'Holidays';
  const destinationName = 'Emergency';
  const description = 'Trip savings';
  const amount = '150000';
  const date = '2026-05-20T15:20';

  await createJar(originName);
  await createJar(destinationName);

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createAllocationButton.click();

  await allocationFormPage.fillDate(date);
  await allocationFormPage.selectOriginJar(originName);
  await allocationFormPage.selectDestinationJar(destinationName);
  await allocationFormPage.fillAmount(amount);
  await allocationFormPage.fillDescription(description);
  await allocationFormPage.submitButton.click();

  // Wait for the movements page to load
  await expect(movementsPage.createAllocationButton).toBeVisible();

  // Check the allocation was created correctly. Expected strings are hardcoded for the
  // hardcoded inputs above (amount '150000' -> CLP, date '2026-05-20T15:20' -> UTC).
  const allocationLink = movementsPage.getMovement(description);
  await expect(allocationLink).toBeVisible();
  await expect(allocationLink.getByText(`${originName} → ${destinationName}`)).toBeVisible();
  await expect(allocationLink.getByText('$150.000')).toBeVisible();
  await expect(allocationLink.getByText('5/20/2026, 3:20:00 PM')).toBeVisible();
});

test('allocation form defaults, jar options and validation', async ({
  createJar,
  deleteJar,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
  page,
}) => {
  test.slow();
  const originName = 'Origin jar name';
  const destinationName = 'Destination jar name';
  const archivedName = 'Archived jar';
  const description = 'Zero allocation';

  await createJar(originName);
  await createJar(destinationName);
  await createJar(archivedName);
  await deleteJar(archivedName);

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

  // The amount must be a number, and it must not be negative
  await allocationFormPage.fillAmount('asdf');
  await allocationFormPage.submitButton.click();
  await expect(page.getByText('Amount must be a non-negative number')).toBeVisible();

  await allocationFormPage.fillAmount('-1');
  await allocationFormPage.submitButton.click();
  await expect(page.getByText('Amount must be a non-negative number')).toBeVisible();

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
  createJar,
  createAllocation,
  movementsPage,
  allocationFormPage,
  page,
}) => {
  test.slow();
  // Initial data
  const initialOriginName = 'Initial origin jar';
  const initialDestinationName = 'Initial destination jar';
  const initialDescription = 'Initial allocation';
  const initialAmount = '150000';
  const initialDate = '2026-06-15T10:00';

  // New data (every field will change)
  const newOriginName = 'New origin jar';
  const newDestinationName = 'New destination jar';
  const newDescription = 'Edited allocation';
  const newAmount = '275000';
  const newDate = '2026-07-11T08:45';

  await createJar(initialOriginName);
  await createJar(initialDestinationName);
  await createJar(newOriginName);
  await createJar(newDestinationName);

  await createAllocation({
    amount: initialAmount,
    date: initialDate,
    description: initialDescription,
    originJarName: initialOriginName,
    destinationJarName: initialDestinationName,
  });

  // Verify the initial allocation exists, then open its edit form
  await expect(movementsPage.createAllocationButton).toBeVisible();
  await movementsPage.getMovement(initialDescription).click();

  // The form is populated with the allocation's current values
  await expect(allocationFormPage.dateInput).toHaveValue(initialDate);
  await expect(allocationFormPage.originJarSelect).toContainText(initialOriginName);
  await expect(allocationFormPage.destinationJarSelect).toContainText(initialDestinationName);
  await expect(allocationFormPage.amountInput).toHaveValue(initialAmount);
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
  await expect(allocationLink.getByText('$275.000')).toBeVisible();
  await expect(allocationLink.getByText('7/11/2026, 8:45:00 AM')).toBeVisible();
  await expect(page.getByText(initialDescription)).toBeHidden();
});

test('can delete an allocation', async ({
  createJar,
  createAllocation,
  movementsPage,
  allocationFormPage,
}) => {
  test.slow();
  const originName = 'Deletable origin jar';
  const destinationName = 'Deletable destination jar';
  const description = 'Allocation to delete';

  await createJar(originName);
  await createJar(destinationName);

  await createAllocation({
    description,
    originJarName: originName,
    destinationJarName: destinationName,
  });

  // Verify the allocation exists, then open its edit form
  await expect(movementsPage.createAllocationButton).toBeVisible();
  await expect(movementsPage.getMovement(description)).toBeVisible();
  await movementsPage.getMovement(description).click();

  await allocationFormPage.deleteButton.click();

  // Verify the allocation no longer exists on the movements page
  await expect(movementsPage.createAllocationButton).toBeVisible();
  await expect(movementsPage.getMovement(description)).toBeHidden();
});

test('focus flows from one field to the next as a new allocation is filled in', async ({
  createJar,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
  page,
}) => {
  const originName = 'Focus flow origin';
  const destinationName = 'Focus flow destination';

  await createJar(originName);
  await createJar(destinationName);

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
  await allocationFormPage.amountInput.fill('1000');

  // Enter on the amount field moves focus to the description field
  await allocationFormPage.amountInput.press('Enter');
  await expect(allocationFormPage.descriptionInput).toBeFocused();
});
