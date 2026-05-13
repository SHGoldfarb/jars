import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

import { Link } from '@tanstack/react-router';

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

export const Navbar = () => {
  return (
    <header className="border-b px-6 py-3 ">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="">
          {routes.map((route) => (
            <NavigationMenuItem className="">
              <NavigationMenuLink>
                <Link to={route.href} className="[&.active]:font-bold">
                  {route.name}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
