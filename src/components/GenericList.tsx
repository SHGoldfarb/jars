import { Item, ItemGroup } from 'components/ui/item';
import { Link } from '@tanstack/react-router';
import { Separator } from './ui/separator';
import { buttonVariants } from './ui/variants';
import { Fragment } from 'react';
import type { YearMonthKey } from 'src/lib/yearMonth';

// What a link from a list carries along: the month the list is showing, so the page it opens can
// come back to it (lists that are not month-scoped leave it out), and the bookmark a movement
// form is opened from.
interface GenericListSearch {
  month?: YearMonthKey;
  bookmarkId?: string;
}

// An action either opens a page or acts in place, like switching the list into an edit mode.
export type GenericListAction =
  | { label: string; url: string; search?: GenericListSearch }
  | { label: string; onClick: () => void };

const actionClassName = buttonVariants({ variant: 'outline', size: 'lg' });

export const GenericList = <T extends { id: string; url?: string; search?: GenericListSearch }>({
  title,
  items,
  actions,
  children,
}: {
  // A small heading above the rows, for a list that is one of several on its page.
  title?: string;
  items: T[];
  actions: GenericListAction[];
  children: (item: T) => React.ReactNode;
}) => {
  return (
    <section className="mx-auto w-full max-w-lg px-4 pt-4">
      {title ? (
        <h2 className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">{title}</h2>
      ) : null}
      <ItemGroup className="gap-3">
        {actions.length > 0 ? (
          <div className="flex justify-end gap-2">
            {actions.map((action) =>
              'url' in action ? (
                <Link
                  key={action.label}
                  to={action.url}
                  search={action.search}
                  className={actionClassName}
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={actionClassName}
                >
                  {action.label}
                </button>
              )
            )}
          </div>
        ) : null}
        {items.length > 0 ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            {items.map((item, index) => (
              <Fragment key={item.id}>
                {index > 0 ? <Separator /> : null}
                {item.url ? (
                  <Link to={item.url} search={item.search} className="block">
                    <Item className="rounded-none">{children(item)}</Item>
                  </Link>
                ) : (
                  <Item className="rounded-none">{children(item)}</Item>
                )}
              </Fragment>
            ))}
          </div>
        ) : null}
      </ItemGroup>
    </section>
  );
};
