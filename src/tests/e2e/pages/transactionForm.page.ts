import { expect, type Page } from '@playwright/test';

type ComboboxName = 'Type' | 'Account' | 'Jar' | 'Category' | 'Subcategory';

export const transactionFormPageConstructor = (page: Page) => {
  // Dismissing an offered subcategory hands on to the Account selector, which opens in its
  // place, so one Escape is not always enough.
  const closeDropdowns = async () => {
    const listbox = page.getByRole('listbox');
    await page.keyboard.press('Escape');
    while (await listbox.isVisible()) {
      await page.keyboard.press('Escape');
    }
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
  const bookmarkButtonLocator = page.getByRole('button', { name: 'Save as bookmark' });
  const bookmarkButton = {
    click: async () => {
      await closeDropdowns();
      await bookmarkButtonLocator.click();
    },
    locator: () => bookmarkButtonLocator,
  };
  // What the bookmark button turns into once it has saved the values the form holds.
  const bookmarkedButton = page.getByRole('button', { name: 'Bookmarked' });
  // Like Submit: the form opens a selector on mount, so the dropdown is dismissed first.
  const cancelButtonLocator = page.getByRole('button', { name: 'Cancel' });
  const cancelButton = {
    click: async () => {
      await closeDropdowns();
      await cancelButtonLocator.click();
    },
    locator: () => cancelButtonLocator,
  };
  const amountInput = page.getByLabel('Amount');
  const dateInput = page.getByLabel('Date');
  const descriptionInput = page.getByLabel('Description');
  const typeSelect = page.getByRole('combobox', { name: 'Type' });
  const accountSelect = page.getByRole('combobox', { name: 'Account' });
  const jarSelect = page.getByRole('combobox', { name: 'Jar' });
  const categorySelect = page.getByRole('combobox', { name: 'Category', exact: true });
  const subcategorySelect = page.getByRole('combobox', { name: 'Subcategory' });

  const combobox = (comboboxName: ComboboxName) =>
    // Exact: "Category" would otherwise also match the Subcategory selector.
    page.getByRole('combobox', { name: comboboxName, exact: true });

  const selectOption = async (comboboxName: ComboboxName, option: string) => {
    await closeDropdowns();
    await combobox(comboboxName).click();
    await page.getByRole('option', { name: option, exact: true }).click();
  };

  const selectType = (kind: 'Income' | 'Expense') => selectOption('Type', kind);
  const selectAccount = (name: string) => selectOption('Account', name);
  const selectJar = (name: string) => selectOption('Jar', name);
  const selectCategory = (name: string) => selectOption('Category', name);
  const selectSubcategory = (name: string) => selectOption('Subcategory', name);

  const selectFirstAccount = async () => {
    await closeDropdowns();
    await accountSelect.click();
    const firstOption = page.getByRole('option').first();
    await firstOption.click();
  };

  const selectFirstJar = async () => {
    await closeDropdowns();
    await jarSelect.click();
    const firstOption = page.getByRole('option').first();
    await firstOption.click();
  };

  const selectFirstCategory = async () => {
    await closeDropdowns();
    await categorySelect.click();
    const firstOption = page.getByRole('option').first();
    await firstOption.click();
  };

  // What the selector is showing: the chosen option, or its placeholder when it holds nothing.
  // Dropdowns are closed first because an open one hides the rest of the form from the
  // accessibility tree, and with it the selector being asked about.
  const expectSelection = async (comboboxName: ComboboxName, selection: string) => {
    await closeDropdowns();
    await expect(combobox(comboboxName)).toHaveText(selection);
  };

  const expectOptionToExist = async (comboboxName: ComboboxName, option: string) => {
    await closeDropdowns();
    await combobox(comboboxName).click();
    await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  };

  const expectOptionToNotExist = async (comboboxName: ComboboxName, option: string) => {
    await closeDropdowns();
    await combobox(comboboxName).click();
    await expect(page.getByRole('option', { name: option, exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
  };

  // Every option the selector offers, in the order it offers them.
  const expectOptionsInOrder = async (comboboxName: ComboboxName, options: string[]) => {
    await closeDropdowns();
    await combobox(comboboxName).click();
    await expect(page.getByRole('option')).toHaveText(options);
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

  // What the description field offers to complete once `typed` is in it, in the order it offers
  // it. Leaves `typed` in the field.
  const expectDescriptionSuggestions = async (typed: string, suggestions: string[]) => {
    await closeDropdowns();
    await descriptionInput.fill(typed);
    await descriptionInput.click();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText(suggestions);
    await page.keyboard.press('Escape');
  };

  const pickDescriptionSuggestion = async (typed: string, suggestion: string) => {
    await closeDropdowns();
    await descriptionInput.fill(typed);
    await descriptionInput.click();
    await page.getByRole('listbox').getByRole('option', { name: suggestion }).click();
  };

  const fillDate = async (date: string) => {
    await closeDropdowns();
    await dateInput.fill(date);
  };

  return {
    submitButton,
    bookmarkButton,
    bookmarkedButton,
    amountInput,
    dateInput,
    descriptionInput,
    typeSelect,
    accountSelect,
    jarSelect,
    categorySelect,
    subcategorySelect,
    selectType,
    selectAccount,
    selectJar,
    selectCategory,
    selectSubcategory,
    selectFirstAccount,
    selectFirstJar,
    selectFirstCategory,
    expectSelection,
    expectOptionToExist,
    expectOptionToNotExist,
    expectOptionsInOrder,
    expectCategoryOptionToExist,
    expectCategoryOptionToNotExist,
    fillAmount,
    fillDescription,
    fillDate,
    expectDescriptionSuggestions,
    pickDescriptionSuggestion,
    deleteButton,
    cancelButton,
  };
};

export type TransactionFormPage = ReturnType<typeof transactionFormPageConstructor>;
