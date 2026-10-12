import { expect } from '@playwright/test';
import { test as base } from './setup/actions';
import { seedBackupFile, type SeedData } from './setup/seed';

export { DEFAULT_MOVEMENT_DATE, defaultData } from './setup/seed';

const test = base.extend<{
  // Replaces all data with the given data and leaves the browser on Settings. A test whose
  // subject is a create form walks that form itself; every other test starts from here.
  seedData: (data: SeedData) => Promise<void>;
}>({
  seedData: async ({ rootLayoutPage, settingsPage }, use) => {
    await use(async (data) => {
      await rootLayoutPage.navButton('Settings').click();
      await settingsPage.pickFileAndConfirm('Load from backup', seedBackupFile(data));
      await expect(settingsPage.statusMessage).toHaveText('Backup restored.');
    });
  },
});

export { test };
