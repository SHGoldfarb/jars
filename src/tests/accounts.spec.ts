import { expect } from '@playwright/test';
import { test } from './setup';

test('has create account button', async ({ accountsPage }) => {
  await accountsPage.goto();

  await expect(accountsPage.createAccountButton).toBeVisible();
});
