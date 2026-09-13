import { Item, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import { Link } from '@tanstack/react-router';
import { Separator } from './ui/separator';
import { Fragment } from 'react';
import type { YearMonthKey } from 'src/lib/yearMonth';

export interface GenericListAction {
  label: string;
  url: string;
  // The month the list is showing, carried into the page the action opens so it can come back
  // to it. Lists that are not month-scoped leave it out.
  search?: { month: YearMonthKey };
}

export const GenericList = <T extends { id: string; url?: string }>({
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
        {actions.map((action) => (
          <Link key={action.url} to={action.url} search={action.search}>
            <ItemContent>
              <ItemTitle className="mx-auto font-bold">{action.label}</ItemTitle>
            </ItemContent>
          </Link>
        ))}
      </Item>
      {items.map((item) => (
        <Fragment key={item.id}>
          <Separator />
          {item.url ? (
            <Link to={item.url}>
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
