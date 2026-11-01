import { Link } from '@tanstack/react-router';
import { ArrowLeftRightIcon, BookmarkIcon, PiggyBankIcon, PlusIcon } from 'lucide-react';
import type { YearMonthKey } from 'src/lib/yearMonth';
import { cn } from 'src/lib/utils';

const actions = [
  { label: 'Transaction', name: 'Add transaction', url: '/transactions/new', icon: PlusIcon },
  { label: 'Transfer', name: 'Add transfer', url: '/transfers/new', icon: ArrowLeftRightIcon },
  { label: 'Allocation', name: 'Add allocation', url: '/allocations/new', icon: PiggyBankIcon },
  { label: 'Bookmarks', name: 'Bookmarks', url: '/bookmarks', icon: BookmarkIcon },
] as const;

// Everything a movement can be started from, as one row of tiles. A transaction is what is added
// most, so its tile is the filled one. Each tile's name says what it does in full - "Add
// transfer" - while the tile itself only has room for the noun.
export const MovementActions = ({ month }: { month: YearMonthKey }) => (
  <nav aria-label="New movement" className="mx-auto grid max-w-lg grid-cols-4 gap-2 px-4">
    {actions.map(({ label, name, url, icon: Icon }, index) => (
      <Link
        key={url}
        to={url}
        search={{ month }}
        aria-label={name}
        className={cn(
          'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[0.6875rem] font-medium transition-colors',
          index === 0
            ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/85'
            : 'bg-card hover:bg-muted'
        )}
      >
        <Icon aria-hidden className="size-5" />
        {label}
      </Link>
    ))}
  </nav>
);
