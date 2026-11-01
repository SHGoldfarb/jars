import { Link } from '@tanstack/react-router';

// A switch between sibling views of one page, like a category list's Income and Expense tabs.
export const SegmentedNav = ({
  label,
  routes,
}: {
  label: string;
  routes: { name: string; href: string }[];
}) => (
  <nav aria-label={label} className="flex justify-center px-4 pt-4">
    <ul className="inline-flex rounded-lg bg-muted p-1">
      {routes.map((route) => (
        <li key={route.name}>
          <Link
            to={route.href}
            className="block rounded-md px-4 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-background [&.active]:text-foreground [&.active]:shadow-sm"
          >
            {route.name}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);
