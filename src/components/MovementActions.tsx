import { Link } from '@tanstack/react-router';
import {
  ArrowLeftRightIcon,
  BookmarkIcon,
  PiggyBankIcon,
  PlusIcon,
  CircleDollarSignIcon,
} from 'lucide-react';
import type { YearMonthKey } from 'src/lib/yearMonth';

const actions = [
  {
    label: 'Transaction',
    name: 'Add transaction',
    url: '/transactions/new',
    icon: CircleDollarSignIcon,
    creates: true,
  },
  {
    label: 'Transfer',
    name: 'Add transfer',
    url: '/transfers/new',
    icon: ArrowLeftRightIcon,
    creates: true,
  },
  {
    label: 'Allocation',
    name: 'Add allocation',
    url: '/allocations/new',
    icon: PiggyBankIcon,
    creates: true,
  },
  { label: 'Bookmarks', name: 'Bookmarks', url: '/bookmarks', icon: BookmarkIcon, creates: false },
] as const;

// Everything a movement can be started from, as one row of tiles. The three tiles that create a
// movement look alike - each icon carries the same small plus badge - while bookmarks has none
// because it opens a list. Each tile's name says what it does in full - "Add transfer" - while the
// tile itself only has room for the noun.
export const MovementActions = ({ month }: { month: YearMonthKey }) => (
  <nav aria-label="New movement" className="mx-auto grid max-w-lg grid-cols-4 gap-2 px-4">
    {actions.map(({ label, name, url, icon: Icon, creates }) => (
      <Link
        key={url}
        to={url}
        search={{ month }}
        aria-label={name}
        className="group flex flex-col items-center gap-1.5 rounded-xl border bg-card py-3 text-[0.6875rem] font-medium transition-colors hover:bg-muted"
      >
        <span className="relative">
          <Icon aria-hidden className="size-5" />
          {creates && (
            <span
              aria-hidden
              className="absolute -right-1.5 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card transition-colors group-hover:ring-muted"
            >
              <PlusIcon className="size-2.5" strokeWidth={3} />
            </span>
          )}
        </span>
        {label}
      </Link>
    ))}
  </nav>
);
