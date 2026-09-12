import { readFile } from 'node:fs/promises';
import { type Page } from '@playwright/test';

export type SettingsActionName =
  | 'Create backup'
  | 'Load from backup'
  | 'Export to CSV'
  | 'Import from Money Manager Excel'
  | 'Clear all data';

export interface SettingsFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export const settingsPageConstructor = (page: Page) => {
  const action = (name: SettingsActionName) => page.getByRole('region', { name });
  // The trigger of an action carries its name, whether it is a button or a file picker.
  const actionTrigger = (name: SettingsActionName) => action(name).getByText(name, { exact: true });
  const actionButton = (name: SettingsActionName) => action(name).getByRole('button', { name });
  const fileInput = (name: SettingsActionName) => action(name).getByLabel(name);
  const actionDescription = (name: SettingsActionName) =>
    action(name).getByRole('paragraph').first();
  const actionWarning = (name: SettingsActionName) => action(name).getByRole('paragraph').nth(1);
  const statusMessage = page.getByRole('alert');

  // The dialog is portalled out of the action's card, so it is located from the page.
  const confirmDialog = (name: SettingsActionName) =>
    page.getByRole('alertdialog', { name: `${name}?` });
  const confirmButton = (name: SettingsActionName) =>
    confirmDialog(name).getByRole('button', { name });
  const cancelButton = (name: SettingsActionName) =>
    confirmDialog(name).getByRole('button', { name: 'Cancel' });

  const pickFile = (name: SettingsActionName, file: SettingsFile) =>
    fileInput(name).setInputFiles(file);

  // A destructive file action does nothing until it is confirmed, so a caller that picked a
  // file and stopped there would be waiting on something that never happens.
  const pickFileAndConfirm = async (name: SettingsActionName, file: SettingsFile) => {
    await pickFile(name, file);
    await confirmButton(name).click();
  };

  // A destructive button action does nothing until it is confirmed, so a caller that clicked
  // and stopped there would be waiting on something that never happens.
  const clickActionAndConfirm = async (name: SettingsActionName) => {
    await actionButton(name).click();
    await confirmButton(name).click();
  };

  // The download has to be awaited from before the click, so the two belong together.
  const downloadFromAction = async (name: SettingsActionName) => {
    const download = page.waitForEvent('download');
    await actionButton(name).click();
    return await download;
  };

  // What most callers want from a download is its contents, which are only readable once the
  // browser has put the file on disk.
  const downloadContentsFromAction = async (name: SettingsActionName) => {
    const download = await downloadFromAction(name);
    return await readFile(await download.path(), 'utf8');
  };

  return {
    action,
    actionTrigger,
    actionButton,
    fileInput,
    actionDescription,
    actionWarning,
    statusMessage,
    confirmDialog,
    confirmButton,
    cancelButton,
    pickFile,
    pickFileAndConfirm,
    clickActionAndConfirm,
    downloadFromAction,
    downloadContentsFromAction,
  };
};

export type SettingsPage = ReturnType<typeof settingsPageConstructor>;
