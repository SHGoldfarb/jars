import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Navbar } from 'components/Navbar';
import { UpdatePrompt } from 'components/UpdatePrompt';

export const RootLayout = () => (
  <>
    <UpdatePrompt />
    <Navbar />
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);
