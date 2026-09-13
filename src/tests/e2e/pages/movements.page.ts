import { expect, type Page } from '@playwright/test';

export const movementsPageConstructor = (page: Page) => {
  const createTransactionButton = page.getByRole('link', { name: 'Add transaction' });
  const createTransferButton = page.getByRole('link', { name: 'Add transfer' });
  const createAllocationButton = page.getByRole('link', { name: 'Add allocation' });
  const getMovement = (description: string) =>
    page.getByRole('link', { name: new RegExp(description, 'i') });
  // Every row says which kind of movement it is, so a kind that should not be in the list can
  // be asserted absent without knowing which row would have carried it.
  const movementKind = (kind: 'Transaction' | 'Transfer' | 'Allocation') =>
    page.getByText(kind, { exact: true });

  const monthSelect = page.getByRole('combobox', { name: 'Month' });
  const previousMonthButton = page.getByRole('button', { name: 'Previous month' });
  const nextMonthButton = page.getByRole('button', { name: 'Next month' });

  const selectMonth = async (month: string) => {
    await monthSelect.click();
    await page.getByRole('option', { name: month, exact: true }).click();
  };

  const expectMonthOptionToExist = async (month: string) => {
    await monthSelect.click();
    await expect(page.getByRole('option', { name: month, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  };

  const expectMonthOptionToNotExist = async (month: string) => {
    await monthSelect.click();
    await expect(page.getByRole('option', { name: month, exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
  };

  const expectMovementToExist = async (description: string) => {
    await expect(getMovement(description)).toBeVisible();
  };

  const expectMovementToNotExist = async (description: string) => {
    await expect(getMovement(description)).not.toBeVisible();
  };

  return {
    monthSelect,
    previousMonthButton,
    nextMonthButton,
    selectMonth,
    expectMonthOptionToExist,
    expectMonthOptionToNotExist,
    createTransactionButton,
    createTransferButton,
    createAllocationButton,
    getMovement,
    movementKind,
    expectMovementToExist,
    expectMovementToNotExist,
  };
};

export type MovementsPage = ReturnType<typeof movementsPageConstructor>;
