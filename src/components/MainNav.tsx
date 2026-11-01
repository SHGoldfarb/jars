import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

export interface MainNavRoute {
  name: string;
  href: string;
  icon: LucideIcon;
}

// The app's own sections. On a phone they are a tab bar along the bottom, where a thumb reaches
// them, and the header has nothing else to show, so it takes no room at all; from tablet width up
// they sit in the header next to the app's name. One set of links serves both, so every section
// is linked exactly once.
export const MainNav = ({ routes }: { routes: MainNavRoute[] }) => (
  <header className="bg-background sm:sticky sm:top-0 sm:z-40 sm:border-b">
    <div className="mx-auto max-w-3xl px-4 sm:flex sm:h-12 sm:items-center sm:justify-between">
      <span className="hidden text-sm font-semibold tracking-tight sm:inline">Jars</span>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] sm:static sm:border-0 sm:pb-0"
      >
        <ul className="grid grid-cols-5 sm:flex sm:gap-1">
          {routes.map(({ name, href, icon: Icon }) => (
            <li key={name}>
              <Link
                to={href}
                className="flex flex-col items-center gap-1 py-2 text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex-row sm:rounded-md sm:px-3 sm:py-1.5 sm:text-xs sm:hover:bg-muted [&.active]:text-primary sm:[&.active]:bg-muted sm:[&.active]:text-foreground"
              >
                <Icon aria-hidden className="size-5 sm:hidden" />
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);
