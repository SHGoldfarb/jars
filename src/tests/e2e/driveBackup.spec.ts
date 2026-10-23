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
    expect(googleDrive.popupHints()).toEqual([undefined]);
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

  test('a due backup waits on Settings for a click, and opening the app never contacts Google', async ({
    page,
    googleDrive,
    seedData,
    createTransaction,
    rootLayoutPage,
    settingsPage,
    movementsPage,
  }) => {
    // Connects, changes data, and reopens the app several times over two simulated days.
    test.slow();
    const reconnect = settingsPage.driveBackupButton('Reconnect Google Drive');
    // Opening the app again, at a given time, from its start page as a user would. Loading the
    // app is the use case here, so this test navigates by URL where the others click.
    const reopenAppAt = async (iso: string) => {
      await page.clock.setFixedTime(new Date(iso));
      await page.goto('/');
    };
    const openSettings = async () => {
      await rootLayoutPage.navButton('Settings').click();
      await expect(settingsPage.driveBackup).toBeVisible();
    };

    // Opened again once the clock is pinned: the app first loaded at the real time, and a pinned
    // time earlier than that would make what it fetched then look fresh for hours.
    await reopenAppAt('2026-10-17T12:00:00.000Z');
    await seedData(defaultData);
    await settingsPage.driveBackupButton('Setup backup to Google Drive').click();
    await expect(settingsPage.driveBackup).toContainText('Last backup 10/17/2026, 12:00:00 PM.');

    // Changed, but less than a day since the last backup: not due yet. Dated inside the pinned
    // month, as Movements opens on the app's current month.
    await createTransaction({ description: 'Changed after the backup', date: '2026-10-17T09:00' });
    await expect(movementsPage.getMovement('Changed after the backup')).toBeVisible();
    await reopenAppAt('2026-10-18T11:00:00.000Z');
    await openSettings();
    await expect(settingsPage.driveBackup).toContainText('Last backup 10/17/2026, 12:00:00 PM.');
    await expect(reconnect).toBeHidden();

    // More than a day: due. Opening the app checks that locally and contacts no one.
    const requestsBeforeOpening = googleDrive.requests().length;
    await reopenAppAt('2026-10-18T13:00:00.000Z');
    await expect(rootLayoutPage.navButton('Settings')).toBeVisible();
    expect(googleDrive.requests().slice(requestsBeforeOpening)).toEqual([]);
    await openSettings();
    await expect(settingsPage.driveBackup).toContainText(
      'Your last backup was 1 day ago. Reconnect Google Drive to back up.'
    );

    // Closing Google's popup is the user's choice, not an error: the prompt stays, quietly.
    googleDrive.setPopup('close');
    await reconnect.click();
    await expect.poll(() => googleDrive.popupHints()).toHaveLength(2);
    await expect(reconnect).toBeVisible();
    await expect(settingsPage.driveBackup.getByRole('alert')).toBeHidden();

    // Offline: the prompt stays, and says why nothing happened.
    googleDrive.setPopup('grant');
    googleDrive.setReachable(false);
    await reconnect.click();
    await expect(settingsPage.driveBackup.getByRole('alert')).toHaveText(
      "Couldn't reach Google Drive. Try again when you're online."
    );
    await expect(reconnect).toBeVisible();
    expect(googleDrive.uploads()).toHaveLength(1);

    // Back online: one click backs up, into the same folder.
    googleDrive.setReachable(true);
    await reconnect.click();
    await expect(settingsPage.driveBackup).toContainText(
      "Backing up to the jars folder in someone@example.com's Google Drive. Last backup 10/18/2026, 1:00:00 PM."
    );
    await expect(settingsPage.driveBackup.getByRole('alert')).toBeHidden();
    expect(googleDrive.folders()).toHaveLength(1);
    expect(googleDrive.uploads().map(({ folderId, name }) => ({ folderId, name }))).toEqual([
      { folderId: 'folder-1', name: 'jars-backup-2026-10-17.json' },
      { folderId: 'folder-1', name: 'jars-backup-2026-10-18.json' },
    ]);
    // Each popup after setup preselects the connected account.
    expect(googleDrive.popupHints()).toEqual([
      undefined,
      'someone@example.com',
      'someone@example.com',
    ]);

    // More than a day later again, with nothing changed since: nothing to back up.
    await reopenAppAt('2026-10-19T14:00:00.000Z');
    await openSettings();
    await expect(settingsPage.driveBackup).toContainText('Last backup 10/18/2026, 1:00:00 PM.');
    await expect(reconnect).toBeHidden();
  });
});
