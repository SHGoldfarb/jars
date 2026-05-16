import { Item, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import { Link } from '@tanstack/react-router';

export const GenericNameableList = ({
  items,
  addLabel,
  addUrl,
}: {
  items: { name: string; id: string; url: string }[];
  addLabel: string;
  addUrl: string;
}) => {
  return (
    <ItemGroup className="p-6 max-w-lg mx-auto">
      <Link to={addUrl}>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle className="mx-auto font-bold">{addLabel}</ItemTitle>
          </ItemContent>
        </Item>
      </Link>
      {items.map((item) => (
        <Link to={item.url} key={item.id}>
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{item.name}</ItemTitle>
            </ItemContent>
          </Item>
        </Link>
      ))}
    </ItemGroup>
  );
};
