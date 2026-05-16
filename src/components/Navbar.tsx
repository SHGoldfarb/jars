import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from 'components/ui/navigation-menu';

import { Link } from '@tanstack/react-router';

export const Navbar = ({ routes }: { routes: { name: string; href: string }[] }) => {
  return (
    <header className="border-b px-6 py-3 ">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="">
          {routes.map((route) => (
            <NavigationMenuItem className="" key={route.name}>
              <NavigationMenuLink asChild>
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
