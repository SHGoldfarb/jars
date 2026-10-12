import { expect } from '@playwright/test';
import { defaultData, test } from './setup';

test('can create jar', async ({ rootLayoutPage, jarsPage, jarFormPage }) => {
  const jarName = 'Test Jar';

  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.createJarButton.click();
  await jarFormPage.nameInput.fill(jarName);
  await jarFormPage.submitButton.click();
  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Contains the new jar
  await jarsPage.expectJarToExist(jarName);
});

test('can delete jar', async ({ rootLayoutPage, jarsPage, jarFormPage, seedData }) => {
  const name = 'Jar to delete';

  await seedData({ jars: [name] });

  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.clickJar(name);
  await jarFormPage.deleteButton.click();

  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Does not contain the jar
  await jarsPage.expectJarToNotExist(name);
});

test('can edit jar', async ({ rootLayoutPage, jarsPage, jarFormPage, seedData }) => {
  const initialName = 'Jar to be renamed';
  const newName = 'Renamed jar';

  await seedData({ jars: [initialName] });

  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.clickJar(initialName);

  // Name input should be pre-filled with the current name
  await expect(jarFormPage.nameInput).toHaveValue(initialName);

  // Fill and submit
  await jarFormPage.nameInput.fill(newName);
  await jarFormPage.submitButton.click();

  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Contains the updated jar and not the old one
  await jarsPage.expectJarToExist(newName);
  await jarsPage.expectJarToNotExist(initialName);
});

test('jars show balance', async ({ seedData, rootLayoutPage, jarsPage }) => {
  const jarName = defaultData.jars[0];
  const secondJarName = 'Savings Jar';

  await seedData({
    ...defaultData,
    jars: [jarName, secondJarName],
    transactions: [
      // Income transaction should add to jar balance
      { amount: '10000', description: 'income transaction', type: 'Income', jarName },
      // Expense transaction should substract from jar balance
      { amount: '3000', description: 'expense transaction', type: 'Expense', jarName },
      // Deleted transaction should not count
      {
        amount: '12345',
        description: 'deleted transaction',
        type: 'Expense',
        jarName,
        archived: true,
      },
      // Transaction belonging to another jar shouldn't count
      {
        amount: '12345',
        description: 'different jar',
        type: 'Expense',
        jarName: secondJarName,
      },
    ],
  });

  await rootLayoutPage.navButton('Jars').click();

  // Expected string is hardcoded for the hardcoded amounts above: 10000 income - 3000 expense.
  await expect(jarsPage.getJar(jarName)).toContainText('$7,000');
});

test('delete button is disabled for jars with non zero balance', async ({
  seedData,
  rootLayoutPage,
  jarsPage,
  jarFormPage,
}) => {
  await seedData({ ...defaultData, transactions: [{ description: 'Gives the jar a balance' }] });
  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.clickJar(defaultData.jars[0]);
  await expect(jarFormPage.deleteButton).toBeDisabled();
});

test('allocations move balance between jars', async ({ seedData, rootLayoutPage, jarsPage }) => {
  const originJarName = defaultData.jars[0];
  const destinationJarName = 'Savings jar';

  // Fund the origin jar, then move part of it to the destination jar
  await seedData({
    ...defaultData,
    jars: [originJarName, destinationJarName],
    transactions: [
      {
        amount: '10000',
        description: 'income transaction',
        type: 'Income',
        jarName: originJarName,
      },
    ],
    allocations: [
      {
        amount: '4000',
        description: 'jar to jar allocation',
        originJarName,
        destinationJarName,
      },
    ],
  });

  await rootLayoutPage.navButton('Jars').click();

  // Expected balances are hardcoded for the hardcoded amounts above (10000 - 4000, 0 + 4000)
  await expect(jarsPage.getJar(originJarName)).toContainText('$6,000');
  await expect(jarsPage.getJar(destinationJarName)).toContainText('$4,000');
});

test('delete button is disabled for a jar whose balance comes from an allocation', async ({
  seedData,
  rootLayoutPage,
  jarsPage,
  jarFormPage,
}) => {
  const originJarName = 'Allocation origin jar';
  const destinationJarName = 'Allocation destination jar';

  await seedData({
    jars: [originJarName, destinationJarName],
    allocations: [
      {
        amount: '4000',
        description: 'allocation giving a jar a balance',
        originJarName,
        destinationJarName,
      },
    ],
  });

  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.clickJar(destinationJarName);

  await expect(jarFormPage.deleteButton).toBeDisabled();
});

test('shows jars, listed alphabetically', async ({ rootLayoutPage, jarsPage, seedData }) => {
  // Seeded out of alphabetical order, so the order shown cannot be the seeded order.
  await seedData({ jars: ['Travel', 'Emergency', 'Rent'] });

  await rootLayoutPage.navButton('Jars').click();
  await jarsPage.expectJarsInOrder(['Emergency', 'Rent', 'Travel']);
});
