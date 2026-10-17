import { Item, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import { Link } from '@tanstack/react-router';
import { Separator } from './ui/separator';
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

export const GenericList = <T extends { id: string; url?: string; search?: GenericListSearch }>({
  items,
  actions,
  children,
}: {
  items: T[];
  actions: GenericListAction[];
  children: (item: T) => React.ReactNode;
}) => {
  return (
    <ItemGroup className="max-w-lg mx-auto gap-0">
      <Item className="flex justify-center">
        {actions.map((action) => {
          const content = (
            <ItemContent>
              <ItemTitle className="mx-auto font-bold">{action.label}</ItemTitle>
            </ItemContent>
          );
          return 'url' in action ? (
            <Link key={action.label} to={action.url} search={action.search}>
              {content}
            </Link>
          ) : (
            <button key={action.label} type="button" onClick={action.onClick}>
              {content}
            </button>
          );
        })}
      </Item>
      {items.map((item) => (
        <Fragment key={item.id}>
          <Separator />
          {item.url ? (
            <Link to={item.url} search={item.search}>
              <Item>{children(item)}</Item>
            </Link>
          ) : (
            <Item>{children(item)}</Item>
          )}
        </Fragment>
      ))}
    </ItemGroup>
  );
};
