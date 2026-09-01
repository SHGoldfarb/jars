import { expect, type Page } from '@playwright/test';

type ComboboxName = 'Origin account' | 'Destination account';

export const transferFormPageConstructor = (page: Page) => {
  const closeDropdowns = async () => {
    await page.keyboard.press('Escape');
  };
  const submitButtonLocator = page.getByRole('button', { name: 'Submit' });
  const submitButton = {
    click: async () => {
      await closeDropdowns();
      await submitButtonLocator.click();
    },
    locator: () => submitButtonLocator,
  };
  const deleteButton = page.getByRole('button', { name: 'Delete' });
  const amountInput = page.getByLabel('Amount');
  const dateInput = page.getByLabel('Date');
  const descriptionInput = page.getByLabel('Description');
  const originAccountSelect = page.getByRole('combobox', { name: 'Origin account' });
  const destinationAccountSelect = page.getByRole('combobox', { name: 'Destination account' });

  const selectOption = async (comboboxName: ComboboxName, option: string) => {
    await closeDropdowns();
    await page.getByRole('combobox', { name: comboboxName }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
  };

  const selectOriginAccount = (name: string) => selectOption('Origin account', name);
  const selectDestinationAccount = (name: string) => selectOption('Destination account', name);

  const expectOptionToExist = async (comboboxName: ComboboxName, option: string) => {
    await closeDropdowns();
    await page.getByRole('combobox', { name: comboboxName }).click();
    await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  };

  const expectOptionToNotExist = async (comboboxName: ComboboxName, option: string) => {
    await closeDropdowns();
    await page.getByRole('combobox', { name: comboboxName }).click();
    await expect(page.getByRole('option', { name: option, exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
  };

  const fillAmount = async (amount: string) => {
    await closeDropdowns();
    await amountInput.fill(amount);
  };

  const fillDescription = async (description: string) => {
    await closeDropdowns();
    await descriptionInput.fill(description);
  };

  const fillDate = async (date: string) => {
    await closeDropdowns();
    await dateInput.fill(date);
  };

  return {
    submitButton,
    deleteButton,
    amountInput,
    dateInput,
    descriptionInput,
    originAccountSelect,
    destinationAccountSelect,
    selectOriginAccount,
    selectDestinationAccount,
    expectOptionToExist,
    expectOptionToNotExist,
    fillAmount,
    fillDescription,
    fillDate,
  };
};

export type TransferFormPage = ReturnType<typeof transferFormPageConstructor>;
