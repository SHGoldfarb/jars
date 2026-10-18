import { expect } from '@playwright/test';
import * as z from 'zod';
import { test, defaultData } from './setup';

// Declared here rather than imported, so the test reads the uploaded file from the outside.
const UploadedBackup = z.object({
  createdAtISO: z.string(),
  data: z.object({ accounts: z.array(z.object({ name: z.string() })) }),
});

test.describe('google drive backup', () => {
  // The card's date and the file name are rendered in the browser's zone and locale.
  test.use({ locale: 'en-US', timezoneId: 'UTC' });

  test('setup creates a jars folder in Drive and uploads the same file Create backup downloads', async ({
    page,
    googleDrive,
    seedData,
    settingsPage,
  }) => {
    // Seeds data, connects, then downloads a backup to compare against.
    test.slow();
    await page.clock.setFixedTime(new Date('2026-10-17T12:00:00.000Z'));
    const releaseScript = googleDrive.holdScript();

    await seedData(defaultData);
    const setup = settingsPage.driveBackupButton('Setup backup to Google Drive');
    // The popup has to open inside the click, so the button waits for Google's script.
    await expect(setup).toBeDisabled();
    releaseScript();
    await setup.click();

    await expect(settingsPage.driveBackup).toContainText(
      "Backing up to the jars folder in someone@example.com's Google Drive. Last backup 10/17/2026, 12:00:00 PM."
    );
    expect(googleDrive.popups()).toBe(1);
    expect(googleDrive.folders()).toEqual([
      { id: 'folder-1', name: 'jars', mimeType: 'application/vnd.google-apps.folder' },
    ]);
    const uploads = googleDrive.uploads();
    expect(uploads.map(({ folderId, name }) => ({ folderId, name }))).toEqual([
      { folderId: 'folder-1', name: 'jars-backup-2026-10-17.json' },
    ]);

    const downloaded = await settingsPage.downloadContentsFromAction('Create backup');
    expect(uploads[0]?.contents).toBe(downloaded);
    const uploaded = UploadedBackup.parse(JSON.parse(uploads[0]?.contents ?? ''));
    expect(uploaded.createdAtISO).toBe('2026-10-17T12:00:00.000Z');
    expect(uploaded.data.accounts.map(({ name }) => name)).toEqual(['Wallet']);
  });
});
