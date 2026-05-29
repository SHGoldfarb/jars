import { expect, type Page } from '@playwright/test';

export const movementsPageConstructor = (page: Page) => {
  const goto = () => page.goto('/movements');
  const createTransactionButton = page.getByRole('link', { name: 'Add transaction' });
  const getTransaction = (description: string) =>
    page.getByRole('link', { name: new RegExp(description, 'i') });

  const expectTransactionToExist = async (description: string) => {
    await expect(getTransaction(description)).toBeVisible();
  };

  return {
    goto,
    createTransactionButton,
    getTransaction,
    expectTransactionToExist,
  };
};

export type MovementsPage = ReturnType<typeof movementsPageConstructor>;
