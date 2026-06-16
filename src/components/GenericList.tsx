import { Item, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import { Link } from '@tanstack/react-router';
import { Separator } from './ui/separator';
import { Fragment } from 'react';

export const GenericList = <T extends { id: string; url: string }>({
  items,
  addLabel,
  addUrl,
  children,
}: {
  items: T[];
  addLabel: string;
  addUrl: string;
  children: (item: T) => React.ReactNode;
}) => {
  return (
    <ItemGroup className="max-w-lg mx-auto gap-0">
      <Link to={addUrl}>
        <Item>
          <ItemContent>
            <ItemTitle className="mx-auto font-bold">{addLabel}</ItemTitle>
          </ItemContent>
        </Item>
      </Link>
      {items.map((item) => (
        <Fragment key={item.id}>
          <Separator />
          <Link to={item.url}>
            <Item>{children(item)}</Item>
          </Link>
        </Fragment>
      ))}
    </ItemGroup>
  );
};
