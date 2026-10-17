import { expect } from '@playwright/test';
import { DEFAULT_MOVEMENT_DATE, defaultData, test } from './setup';

// Pin locale/timezone: the rendered dates and amounts below are asserted as literals.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

// A movement row prints its date as en-US `M/D/YYYY, h:mm:ss AM`; a bookmark row has none.
const RENDERED_DATE = /\d{1,2}\/\d{1,2}\/\d{4}/;

// What a form started from a bookmark shows in its date field: today, as the blank form would.
// Read off the test's own clock rather than the app's date helpers.
const todayInputValue = () =>
  new RegExp(`^${new Date().toISOString().slice(0, 10)}T\\d{2}:\\d{2}$`);

const accounts = [defaultData.accounts[0], 'Savings'];
const jars = [defaultData.jars[0], 'Holidays'];

test('a movement of each kind can be saved as a bookmark and is listed in the bookmarks menu', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  transferFormPage,
  allocationFormPage,
  bookmarksPage,
}) => {
  test.slow();

  await seedData({
    ...defaultData,
    accounts,
    jars,
    transactions: [{ description: 'Rent' }],
    transfers: [
      {
        description: 'Savings top-up',
        originAccountName: accounts[0],
        destinationAccountName: accounts[1],
      },
    ],
    allocations: [
      { description: 'Holiday fund', originJarName: jars[0], destinationJarName: jars[1] },
    ],
  });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Rent').click();
  await transactionFormPage.bookmarkButton.click();
  await expect(transactionFormPage.bookmarkedButton).toBeDisabled();

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Savings top-up').click();
  await transferFormPage.bookmarkButton.click();
  await expect(transferFormPage.bookmarkedButton).toBeDisabled();

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Holiday fund').click();
  await allocationFormPage.bookmarkButton.click();
  await expect(allocationFormPage.bookmarkedButton).toBeDisabled();

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();

  // Newest first, each saying which kind of movement it starts, and none carrying a date.
  await bookmarksPage.expectBookmarksInOrder(['Holiday fund', 'Savings top-up', 'Rent']);
  await expect(bookmarksPage.getBookmark('Holiday fund')).toContainText('Allocation');
  await expect(bookmarksPage.getBookmark('Holiday fund')).toContainText(
    'Monthly expenses → Holidays'
  );
  await expect(bookmarksPage.getBookmark('Savings top-up')).toContainText('Transfer');
  await expect(bookmarksPage.getBookmark('Savings top-up')).toContainText('Wallet → Savings');
  await expect(bookmarksPage.getBookmark('Rent')).toContainText('Transaction');
  await expect(bookmarksPage.getBookmark('Rent')).toContainText('$1,000');
  for (const description of ['Holiday fund', 'Savings top-up', 'Rent']) {
    await expect(bookmarksPage.getBookmark(description)).not.toContainText(RENDERED_DATE);
  }
});

test('a bookmark saves what is typed into the form, not what is stored', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  bookmarksPage,
}) => {
  await seedData({ ...defaultData, transactions: [{ description: 'Stored rent' }] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Stored rent').click();
  await transactionFormPage.fillDescription('Typed rent');
  await transactionFormPage.bookmarkButton.click();
  await expect(transactionFormPage.bookmarkedButton).toBeDisabled();

  // Saving it again would only repeat it - until a value changes.
  await transactionFormPage.fillDescription('Typed rent, changed');
  await expect(transactionFormPage.bookmarkButton.locator()).toBeEnabled();

  // Bookmarking never saves the movement itself.
  await transactionFormPage.cancelButton.click();
  await movementsPage.expectMovementToExist('Stored rent');
  await movementsPage.expectMovementToNotExist('Typed rent');

  await movementsPage.bookmarksButton.click();
  await bookmarksPage.expectBookmarksInOrder(['Typed rent']);
  await expect(bookmarksPage.getBookmark('Typed rent')).not.toContainText('changed');
});

test('a form that is not valid is not bookmarked, but its date does not count', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  bookmarksPage,
  page,
}) => {
  await seedData({ ...defaultData, transactions: [{ description: 'Electricity' }] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Electricity').click();

  await transactionFormPage.fillAmount('');
  await transactionFormPage.bookmarkButton.click();
  await expect(page.getByText('Amount is required')).toBeVisible();
  await expect(transactionFormPage.bookmarkButton.locator()).toBeVisible();

  // A bookmark keeps no date, so an empty one does not stand in its way.
  await transactionFormPage.fillAmount('2500');
  await transactionFormPage.fillDate('');
  await transactionFormPage.bookmarkButton.click();
  await expect(transactionFormPage.bookmarkedButton).toBeDisabled();
  await expect(page.getByText('Amount is required')).toBeHidden();

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.expectBookmarksInOrder(['Electricity']);
  await expect(bookmarksPage.getBookmark('Electricity')).toContainText('$2,500');
});

test('a bookmark keeps the movement as it was when it was saved', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  bookmarksPage,
}) => {
  await seedData({ ...defaultData, transactions: [{ description: 'Weekly shop' }] });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Weekly shop').click();
  await transactionFormPage.bookmarkButton.click();
  await expect(transactionFormPage.bookmarkedButton).toBeDisabled();

  // Edited, then deleted: neither reaches the bookmark.
  await transactionFormPage.fillDescription('Monthly shop');
  await transactionFormPage.submitButton.click();
  await movementsPage.getMovement('Monthly shop').click();
  await transactionFormPage.deleteButton.click();
  await movementsPage.expectMovementToNotExist('Monthly shop');

  await movementsPage.bookmarksButton.click();
  await bookmarksPage.expectBookmarksInOrder(['Weekly shop']);
});

test('the bookmarks menu says so when it is empty', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  bookmarksPage,
}) => {
  await seedData(defaultData);

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();

  await expect(bookmarksPage.emptyMessage).toBeVisible();
  // Nothing to edit, so no way into edit mode either.
  await expect(bookmarksPage.editButton).toHaveCount(0);
});

test('selecting a transaction bookmark opens the transaction form with everything but the date pre-filled', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  bookmarksPage,
  page,
}) => {
  await seedData({
    ...defaultData,
    subcategories: [{ categoryName: defaultData.expenseCategories[0], name: 'Fruit' }],
    bookmarks: [
      {
        amount: '4200',
        description: 'Farmers market',
        type: 'Expense',
        categoryName: defaultData.expenseCategories[0],
        subcategoryName: 'Fruit',
      },
    ],
  });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.getBookmark('Farmers market').click();

  await expect(page.getByText('Create Transaction')).toBeVisible();
  await expect(transactionFormPage.amountInput).toHaveValue('$4,200');
  await expect(transactionFormPage.descriptionInput).toHaveValue('Farmers market');
  await transactionFormPage.expectSelection('Type', 'Expense');
  await transactionFormPage.expectSelection('Category', 'Groceries');
  await transactionFormPage.expectSelection('Subcategory', 'Fruit');
  await transactionFormPage.expectSelection('Account', 'Wallet');
  await transactionFormPage.expectSelection('Jar', 'Monthly expenses');
  await expect(transactionFormPage.dateInput).toHaveValue(todayInputValue());

  // Submitting creates a new transaction, and the bookmark stays for next time.
  await transactionFormPage.submitButton.click();
  await movementsPage.expectMovementToExist('Farmers market');
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.expectBookmarksInOrder(['Farmers market']);
});

test('selecting a transfer bookmark opens the transfer form with everything but the date pre-filled', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transferFormPage,
  bookmarksPage,
  page,
}) => {
  await seedData({
    ...defaultData,
    accounts,
    transfers: [
      {
        amount: '30000',
        date: DEFAULT_MOVEMENT_DATE,
        description: 'Rainy day',
        originAccountName: accounts[0],
        destinationAccountName: accounts[1],
      },
    ],
  });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Rainy day').click();
  await transferFormPage.bookmarkButton.click();
  await expect(transferFormPage.bookmarkedButton).toBeDisabled();

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.getBookmark('Rainy day').click();

  await expect(page.getByText('Create Transfer')).toBeVisible();
  await expect(transferFormPage.amountInput).toHaveValue('$30,000');
  await expect(transferFormPage.descriptionInput).toHaveValue('Rainy day');
  await expect(transferFormPage.originAccountSelect).toHaveText('Wallet');
  await expect(transferFormPage.destinationAccountSelect).toHaveText('Savings');
  await expect(transferFormPage.dateInput).toHaveValue(todayInputValue());

  // A second transfer, next to the one the bookmark was saved from: both in this month.
  await transferFormPage.submitButton.click();
  await expect(movementsPage.getMovement('Rainy day')).toHaveCount(2);
});

test('selecting an allocation bookmark opens the allocation form with everything but the date pre-filled', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  allocationFormPage,
  bookmarksPage,
  page,
}) => {
  await seedData({
    ...defaultData,
    jars,
    allocations: [
      {
        amount: '15000',
        date: DEFAULT_MOVEMENT_DATE,
        description: 'Trip savings',
        originJarName: jars[0],
        destinationJarName: jars[1],
      },
    ],
  });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.getMovement('Trip savings').click();
  await allocationFormPage.bookmarkButton.click();
  await expect(allocationFormPage.bookmarkedButton).toBeDisabled();

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.getBookmark('Trip savings').click();

  await expect(page.getByText('Create Allocation')).toBeVisible();
  await expect(allocationFormPage.amountInput).toHaveValue('$15,000');
  await expect(allocationFormPage.descriptionInput).toHaveValue('Trip savings');
  await expect(allocationFormPage.originJarSelect).toHaveText('Monthly expenses');
  await expect(allocationFormPage.destinationJarSelect).toHaveText('Holidays');
  await expect(allocationFormPage.dateInput).toHaveValue(todayInputValue());

  await allocationFormPage.submitButton.click();
  await expect(movementsPage.getMovement('Trip savings')).toHaveCount(2);
});

test('a bookmark whose jar has been deleted opens with the jar left for the user to pick', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  transactionFormPage,
  bookmarksPage,
  page,
}) => {
  await seedData({
    ...defaultData,
    jars: [defaultData.jars[0], { name: 'Old jar', archived: true }],
    bookmarks: [{ description: 'Gym', jarName: 'Old jar' }],
  });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.getBookmark('Gym').click();

  // The jar selector opens on its own, offering only what is still there.
  await expect(page.getByRole('option', { name: defaultData.jars[0], exact: true })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Old jar', exact: true })).toHaveCount(0);

  await transactionFormPage.expectSelection('Jar', 'Select jar');
  await transactionFormPage.expectSelection('Type', 'Expense');
  await transactionFormPage.expectSelection('Category', 'Groceries');
  await transactionFormPage.expectSelection('Account', 'Wallet');
  await expect(transactionFormPage.descriptionInput).toHaveValue('Gym');
});

test('a bookmark can be deleted from the bookmarks menu', async ({
  seedData,
  rootLayoutPage,
  movementsPage,
  bookmarksPage,
}) => {
  await seedData({
    ...defaultData,
    bookmarks: [{ description: 'Streaming' }, { description: 'Phone plan' }],
  });

  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.expectBookmarksInOrder(['Phone plan', 'Streaming']);

  // In edit mode the rows stop opening forms.
  await bookmarksPage.editButton.click();
  await expect(bookmarksPage.getBookmark('Streaming')).toHaveCount(0);
  await bookmarksPage.deleteButton('Streaming').click();
  await expect(bookmarksPage.deleteButton('Streaming')).toHaveCount(0);
  await bookmarksPage.doneButton.click();

  await bookmarksPage.expectBookmarksInOrder(['Phone plan']);

  // Gone for good, not just from this screen.
  await rootLayoutPage.navButton('Movements').click();
  await movementsPage.bookmarksButton.click();
  await bookmarksPage.expectBookmarksInOrder(['Phone plan']);
});
