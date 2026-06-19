import { expect, type Page } from '@playwright/test';

export const transactionFormPageConstructor = (page: Page) => {
  const closeDropdowns = async () => {
    await page.keyboard.press('Escape');
  };
  const gotoCreate = () => page.goto('/transactions/new');
  const submitButtonLocator = page.getByRole('button', { name: 'Submit' });
  const submitButton = {
    click: async () => {
      await closeDropdowns();
      await submitButtonLocator.click();
    },
    locator: () => submitButtonLocator,
  };
  const amountInput = page.getByLabel('Amount');
  const dateInput = page.getByLabel('Date');
  const descriptionInput = page.getByLabel('Description');
  const typeSelect = page.getByRole('combobox', { name: 'Type' });
  const accountSelect = page.getByRole('combobox', { name: 'Account' });
  const jarSelect = page.getByRole('combobox', { name: 'Jar' });
  const categorySelect = page.getByRole('combobox', { name: 'Category' });

  const selectOption = async (
    comboboxName: 'Type' | 'Account' | 'Jar' | 'Category',
    option: string
  ) => {
    await closeDropdowns();
    await page.getByRole('combobox', { name: comboboxName }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
  };

  const selectType = (kind: 'Income' | 'Expense') => selectOption('Type', kind);
  const selectAccount = (name: string) => selectOption('Account', name);
  const selectJar = (name: string) => selectOption('Jar', name);
  const selectCategory = (name: string) => selectOption('Category', name);

  const expectOptionToExist = async (
    comboboxName: 'Type' | 'Account' | 'Jar' | 'Category',
    option: string
  ) => {
    await closeDropdowns();
    await page.getByRole('combobox', { name: comboboxName }).click();
    await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  };

  const expectOptionToNotExist = async (
    comboboxName: 'Type' | 'Account' | 'Jar' | 'Category',
    option: string
  ) => {
    await closeDropdowns();
    await page.getByRole('combobox', { name: comboboxName }).click();
    await expect(page.getByRole('option', { name: option, exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
  };

  const expectCategoryOptionToExist = async (name: string) => {
    await expectOptionToExist('Category', name);
  };

  const expectCategoryOptionToNotExist = async (name: string) => {
    await expectOptionToNotExist('Category', name);
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
    gotoCreate,
    submitButton,
    amountInput,
    dateInput,
    descriptionInput,
    typeSelect,
    accountSelect,
    jarSelect,
    categorySelect,
    selectType,
    selectAccount,
    selectJar,
    selectCategory,
    expectOptionToExist,
    expectOptionToNotExist,
    expectCategoryOptionToExist,
    expectCategoryOptionToNotExist,
    fillAmount,
    fillDescription,
    fillDate,
  };
};

export type TransactionFormPage = ReturnType<typeof transactionFormPageConstructor>;
