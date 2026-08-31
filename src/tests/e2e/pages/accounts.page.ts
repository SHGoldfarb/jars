import { expect, type Page } from '@playwright/test';

export const accountsPageConstructor = (page: Page) => {
  const createAccountButton = page.getByRole('link', { name: 'Add account' });
  const getAccount = (accountName: string) => page.getByRole('link', { name: accountName });
  const expectAccountToExist = async (accountName: string) => {
    await expect(getAccount(accountName)).toBeVisible();
  };
  const expectAccountToNotExist = async (accountName: string) => {
    await expect(getAccount(accountName)).not.toBeVisible();
  };
  const clickAccount = (accountName: string) => getAccount(accountName).click();

  return {
    createAccountButton,
    getAccount,
    expectAccountToExist,
    expectAccountToNotExist,
    clickAccount,
  };
};

export type AccountsPage = ReturnType<typeof accountsPageConstructor>;
