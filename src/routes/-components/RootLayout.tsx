import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Navbar } from 'components/Navbar';
import { UpdatePrompt } from 'components/UpdatePrompt';

const routes = [
  {
    name: 'Movements',
    href: '/movements',
  },
  {
    name: 'Accounts',
    href: '/accounts',
  },
  {
    name: 'Jars',
    href: '/jars',
  },
  {
    name: 'Categories',
    href: '/categories',
  },
];

export const RootLayout = () => (
  <>
    <UpdatePrompt />
    <Navbar routes={routes} />
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);
