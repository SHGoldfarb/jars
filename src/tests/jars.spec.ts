import { expect } from '@playwright/test';
import { test } from './setup';
import { runInOrder } from 'src/lib/utils';

test('can create jar', async ({ jarsPage, jarFormPage }) => {
  const jarName = 'Test Jar';

  await jarsPage.goto();
  await jarsPage.createJarButton.click();
  await jarFormPage.nameInput.fill(jarName);
  await jarFormPage.submitButton.click();
  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Contains the new jar
  await jarsPage.expectJarToExist(jarName);
});

test('shows jars', async ({ jarsPage, createJar }) => {
  const jarNames = ['Holidays', 'Groceries'];

  // Create jars
  await runInOrder(jarNames.map((jarName) => () => createJar(jarName)));

  // Test that they are visible
  await runInOrder(jarNames.map((jarName) => () => jarsPage.expectJarToExist(jarName)));
});

test('can delete jar', async ({ jarsPage, jarFormPage, createJar }) => {
  const name = 'Jar to delete';

  await createJar(name);

  await jarsPage.clickJar(name);
  await jarFormPage.deleteButton.click();

  // Should be redirected to the jars page
  await expect(jarsPage.createJarButton).toBeVisible();

  // Does not contain the jar
  await jarsPage.expectJarToNotExist(name);
});

test('can edit jar', async ({ jarsPage, jarFormPage, createJar }) => {
  const initialName = 'Jar to be renamed';
  const newName = 'Renamed jar';

  await createJar(initialName);

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
