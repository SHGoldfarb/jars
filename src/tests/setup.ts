import { test as base } from '@playwright/test';
import { accountsPageConstructor, type AccountsPage } from './pages/accounts.page';

const test = base.extend<{ accountsPage: AccountsPage }>({
  accountsPage: async ({ page }, use) => {
    await use(accountsPageConstructor(page));
  },
});

export { test };
