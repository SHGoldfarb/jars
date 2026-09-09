import { type Page } from '@playwright/test';

export const rootLayoutPageConstructor = (page: Page) => {
  const navButton = (name: 'Movements' | 'Accounts' | 'Jars' | 'Categories' | 'Settings') =>
    page.getByRole('link', { name, exact: true });

  return {
    navButton,
  };
};

export type RootLayoutPage = ReturnType<typeof rootLayoutPageConstructor>;
