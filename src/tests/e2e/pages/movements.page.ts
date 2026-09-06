import { expect, type Page } from '@playwright/test';

export const movementsPageConstructor = (page: Page) => {
  const createTransactionButton = page.getByRole('link', { name: 'Add transaction' });
  const createTransferButton = page.getByRole('link', { name: 'Add transfer' });
  const createAllocationButton = page.getByRole('link', { name: 'Add allocation' });
  const getMovement = (description: string) =>
    page.getByRole('link', { name: new RegExp(description, 'i') });

  const expectMovementToExist = async (description: string) => {
    await expect(getMovement(description)).toBeVisible();
  };

  return {
    createTransactionButton,
    createTransferButton,
    createAllocationButton,
    getMovement,
    expectMovementToExist,
  };
};

export type MovementsPage = ReturnType<typeof movementsPageConstructor>;
