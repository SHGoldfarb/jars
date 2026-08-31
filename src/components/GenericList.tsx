import { Item, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import { Link } from '@tanstack/react-router';
import { Separator } from './ui/separator';
import { Fragment } from 'react';

export interface GenericListAction {
  label: string;
  url: string;
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
      {actions.map((action) => (
        <Link key={action.url} to={action.url}>
          <Item>
            <ItemContent>
              <ItemTitle className="mx-auto font-bold">{action.label}</ItemTitle>
            </ItemContent>
          </Item>
        </Link>
      ))}
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
