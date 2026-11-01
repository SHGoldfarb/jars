import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AmphoraIcon, LandmarkIcon, ReceiptTextIcon, SettingsIcon, TagsIcon } from 'lucide-react';
import { MainNav, type MainNavRoute } from 'components/MainNav';
import { UpdatePrompt } from 'components/UpdatePrompt';

const routes: MainNavRoute[] = [
  {
    name: 'Movements',
    href: '/movements',
    icon: ReceiptTextIcon,
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: LandmarkIcon,
  },
  {
    name: 'Jars',
    href: '/jars',
    icon: AmphoraIcon,
  },
  {
    name: 'Categories',
    href: '/categories',
    icon: TagsIcon,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

export const RootLayout = () => (
  <>
    <UpdatePrompt />
    <MainNav routes={routes} />
    {/* On a phone the tab bar is fixed over the bottom of the page, so the page leaves room for
        it to scroll clear. */}
    <main className="pb-24 sm:pb-8">
      <Outlet />
    </main>
    <TanStackRouterDevtools />
  </>
);
