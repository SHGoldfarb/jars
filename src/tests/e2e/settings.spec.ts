import { expect } from '@playwright/test';
import { test } from './setup';
import { runInOrder } from 'src/lib/utils';
import type { SettingsActionName } from './pages/settings.page';

const actionNames: SettingsActionName[] = [
  'Create backup',
  'Load from backup',
  'Export to CSV',
  'Import from Money Manager CSV',
  'Clear all data',
];

const descriptions: [SettingsActionName, string][] = [
  [
    'Create backup',
    'Downloads a JSON file with all your accounts, jars, categories and movements.',
  ],
  ['Load from backup', 'Restores a JSON backup created by this app.'],
  ['Export to CSV', 'Downloads your movements as a spreadsheet file.'],
  ['Import from Money Manager CSV', 'Imports a CSV exported by the Money Manager app.'],
  [
    'Clear all data',
    'Removes all accounts, jars, categories, transactions, transfers and allocations.',
  ],
];

const warnings: [SettingsActionName, string][] = [
  ['Load from backup', 'Replaces all current data. This cannot be undone.'],
  ['Import from Money Manager CSV', 'Replaces all current data. This cannot be undone.'],
  ['Clear all data', 'All current data is permanently lost and cannot be recovered.'],
];

test('settings is reachable from the main navigation', async ({ rootLayoutPage, settingsPage }) => {
  await rootLayoutPage.navButton('Settings').click();

  await runInOrder(
    actionNames.map((name) => async () => {
      await expect(settingsPage.actionTrigger(name)).toBeVisible();
    })
  );
});

test('each action explains itself, and the destructive ones warn', async ({
  rootLayoutPage,
  settingsPage,
}) => {
  await rootLayoutPage.navButton('Settings').click();

  await runInOrder([
    ...descriptions.map(([name, description]) => async () => {
      await expect(settingsPage.actionDescription(name)).toHaveText(description);
    }),
    ...warnings.map(([name, warning]) => async () => {
      await expect(settingsPage.actionWarning(name)).toHaveText(warning);
    }),
  ]);
});
