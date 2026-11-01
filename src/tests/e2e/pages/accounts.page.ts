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
  // The headline figure above the list: what every listed account holds between them.
  const total = page.getByRole('region', { name: 'Total in accounts' });
  const clickAccount = (accountName: string) => getAccount(accountName).click();
  // The accounts list itself, told apart from the page's navigation lists by the add action it
  // holds - which is also the row that heads it.
  const accountsList = page.getByRole('list').filter({ has: createAccountButton });
  // A row shows its account's balance next to the name, so each name is matched inside its row
  // rather than against the whole of it.
  const expectAccountsInOrder = async (accountNames: string[]) => {
    await expect(accountsList.getByRole('link')).toHaveText([
      /Add account/,
      ...accountNames.map((accountName) => new RegExp(accountName)),
    ]);
  };

  return {
    createAccountButton,
    getAccount,
    expectAccountToExist,
    expectAccountToNotExist,
    expectAccountsInOrder,
    clickAccount,
    total,
  };
};

export type AccountsPage = ReturnType<typeof accountsPageConstructor>;
