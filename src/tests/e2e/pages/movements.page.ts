import { expect, type Page } from '@playwright/test';

export const movementsPageConstructor = (page: Page) => {
  const createTransactionButton = page.getByRole('link', { name: 'Add transaction' });
  const createTransferButton = page.getByRole('link', { name: 'Add transfer' });
  const getTransaction = (description: string) =>
    page.getByRole('link', { name: new RegExp(description, 'i') });

  const expectTransactionToExist = async (description: string) => {
    await expect(getTransaction(description)).toBeVisible();
  };

  return {
    createTransactionButton,
    createTransferButton,
    getTransaction,
    expectTransactionToExist,
  };
};

export type MovementsPage = ReturnType<typeof movementsPageConstructor>;
