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
  page,
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
  // Allocation rows are not links until the edit route exists, so they are matched by text.
  await expect(page.getByText(description)).toBeVisible();
  await expect(page.getByText(`${originName} → ${destinationName}`)).toBeVisible();
  await expect(page.getByText('$150.000')).toBeVisible();
  await expect(page.getByText('5/20/2026, 3:20:00 PM')).toBeVisible();
});

// TODO: fold all form behavior tests into a single one
test('allocation date defaults to today', async ({
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
}) => {
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.createAllocationButton.click();

  // Date field is prefilled with today (UTC, per test.use above) in datetime-local format
  const today = new Date().toISOString().slice(0, 10);
  await expect(allocationFormPage.dateInput).toHaveValue(new RegExp(`^${today}T\\d{2}:\\d{2}$`));
});

test.describe('allocation form validation', () => {
  test('required fields', async ({
    createJar,
    rootLayoutPage,
    movementsPage,
    allocationFormPage,
    page,
  }) => {
    await createJar('Some jar');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createAllocationButton.click();

    await allocationFormPage.submitButton.click();
    await runInOrder(
      ['Origin jar is required', 'Destination jar is required', 'Amount is required'].map(
        (message) => async () => {
          await expect(page.getByText(message)).toBeVisible();
        }
      )
    );
  });

  test('amount must be a non-negative number', async ({
    createJar,
    rootLayoutPage,
    movementsPage,
    allocationFormPage,
    page,
  }) => {
    test.slow();
    await createJar('Origin jar name');
    await createJar('Destination jar name');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createAllocationButton.click();

    await allocationFormPage.selectOriginJar('Origin jar name');
    await allocationFormPage.selectDestinationJar('Destination jar name');

    await allocationFormPage.fillAmount('asdf');
    await allocationFormPage.submitButton.click();
    await expect(page.getByText('Amount must be a non-negative number')).toBeVisible();

    await allocationFormPage.fillAmount('-1');
    await allocationFormPage.submitButton.click();
    await expect(page.getByText('Amount must be a non-negative number')).toBeVisible();
  });

  test('amount can be zero', async ({
    createJar,
    rootLayoutPage,
    movementsPage,
    allocationFormPage,
    page,
  }) => {
    test.slow();
    const description = 'Zero allocation';
    await createJar('Origin jar name');
    await createJar('Destination jar name');

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createAllocationButton.click();

    await allocationFormPage.selectOriginJar('Origin jar name');
    await allocationFormPage.selectDestinationJar('Destination jar name');
    await allocationFormPage.fillAmount('0');
    await allocationFormPage.fillDescription(description);
    await allocationFormPage.submitButton.click();

    await expect(movementsPage.createAllocationButton).toBeVisible();
    await expect(page.getByText('Amount must be a non-negative number')).toBeHidden();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByText('Origin jar name → Destination jar name')).toBeVisible();
    await expect(page.getByText('$0', { exact: true })).toBeVisible();
  });

  test('a selected jar is not offered in the other selector', async ({
    createJar,
    rootLayoutPage,
    movementsPage,
    allocationFormPage,
  }) => {
    test.slow();
    const firstName = 'First jar';
    const secondName = 'Second jar';
    await createJar(firstName);
    await createJar(secondName);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createAllocationButton.click();

    // Picking an origin jar removes it from the destination options...
    await allocationFormPage.selectOriginJar(firstName);
    await allocationFormPage.expectOptionToNotExist('Destination jar', firstName);
    await allocationFormPage.expectOptionToExist('Destination jar', secondName);

    // ...and picking a destination jar removes it from the origin options. Between the two,
    // origin and destination can never be made equal through the UI.
    await allocationFormPage.selectDestinationJar(secondName);
    await allocationFormPage.expectOptionToNotExist('Origin jar', secondName);
    await allocationFormPage.expectOptionToExist('Origin jar', firstName);
  });

  test('only active jars are selectable', async ({
    createJar,
    deleteJar,
    rootLayoutPage,
    movementsPage,
    allocationFormPage,
  }) => {
    test.slow();
    const activeName = 'Active jar';
    const archivedName = 'Archived jar';
    await createJar(activeName);
    await createJar(archivedName);
    await deleteJar(archivedName);

    await rootLayoutPage.navButton('Movements').click();
    await movementsPage.createAllocationButton.click();

    await allocationFormPage.expectOptionToExist('Origin jar', activeName);
    await allocationFormPage.expectOptionToNotExist('Origin jar', archivedName);
    await allocationFormPage.expectOptionToNotExist('Destination jar', archivedName);
  });
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
