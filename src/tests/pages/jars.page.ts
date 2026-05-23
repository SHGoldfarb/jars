import { expect, type Page } from '@playwright/test';

export const jarsPageConstructor = (page: Page) => {
  const goto = () => page.goto('/jars');
  const createJarButton = page.getByRole('link', { name: 'Add jar' });
  const getJar = (jarName: string) => page.getByRole('link', { name: jarName });
  const expectJarToExist = async (jarName: string) => {
    await expect(getJar(jarName)).toBeVisible();
  };
  const expectJarToNotExist = async (jarName: string) => {
    await expect(getJar(jarName)).not.toBeVisible();
  };
  const clickJar = (jarName: string) => getJar(jarName).click();

  return {
    goto,
    createJarButton,
    getJar,
    expectJarToExist,
    expectJarToNotExist,
    clickJar,
  };
};

export type JarsPage = ReturnType<typeof jarsPageConstructor>;
