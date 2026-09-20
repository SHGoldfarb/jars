import { expect, type Page } from '@playwright/test';

export const jarsPageConstructor = (page: Page) => {
  const createJarButton = page.getByRole('link', { name: 'Add jar' });
  const getJar = (jarName: string) => page.getByRole('link', { name: jarName });
  const expectJarToExist = async (jarName: string) => {
    await expect(getJar(jarName)).toBeVisible();
  };
  const expectJarToNotExist = async (jarName: string) => {
    await expect(getJar(jarName)).not.toBeVisible();
  };
  const clickJar = (jarName: string) => getJar(jarName).click();
  // The jars list itself, told apart from the page's navigation lists by the add action it
  // holds - which is also the row that heads it.
  const jarsList = page.getByRole('list').filter({ has: createJarButton });
  // A row shows its jar's balance next to the name, so each name is matched inside its row
  // rather than against the whole of it.
  const expectJarsInOrder = async (jarNames: string[]) => {
    await expect(jarsList.getByRole('link')).toHaveText([
      /Add jar/,
      ...jarNames.map((jarName) => new RegExp(jarName)),
    ]);
  };

  return {
    createJarButton,
    getJar,
    expectJarToExist,
    expectJarToNotExist,
    expectJarsInOrder,
    clickJar,
  };
};

export type JarsPage = ReturnType<typeof jarsPageConstructor>;
