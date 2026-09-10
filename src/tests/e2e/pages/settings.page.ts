import { type Page } from '@playwright/test';

export type SettingsActionName =
  | 'Create backup'
  | 'Load from backup'
  | 'Export to CSV'
  | 'Import from Money Manager CSV'
  | 'Clear all data';

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

  // The download has to be awaited from before the click, so the two belong together.
  const downloadFromAction = async (name: SettingsActionName) => {
    const download = page.waitForEvent('download');
    await actionButton(name).click();
    return await download;
  };

  return {
    action,
    actionTrigger,
    actionButton,
    fileInput,
    actionDescription,
    actionWarning,
    statusMessage,
    downloadFromAction,
  };
};

export type SettingsPage = ReturnType<typeof settingsPageConstructor>;
