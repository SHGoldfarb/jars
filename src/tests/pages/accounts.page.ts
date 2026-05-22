import { expect, type Page } from '@playwright/test';

export const accountsPageConstructor = (page: Page) => {
  const goto = () => page.goto('/accounts');
  const createAccountButton = page.getByRole('link', { name: 'Add account' });
  const getAccount = (accountName: string) => page.getByRole('link', { name: accountName });
  const expectAccountToExist = async (accountName: string) => {
    await expect(getAccount(accountName)).toBeVisible();
  };

  return { goto, createAccountButton, getAccount, expectAccountToExist };
};

export type AccountsPage = ReturnType<typeof accountsPageConstructor>;
