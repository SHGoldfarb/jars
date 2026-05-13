import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Navbar, UpdatePrompt } from './root-layout';

export const RootLayout = () => (
  <>
    <UpdatePrompt />
    <Navbar />
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);
