import { ItemContent, ItemTitle } from 'components/ui/item';
import { GenericList } from './GenericList';

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
    <GenericList items={items} addLabel={addLabel} addUrl={addUrl}>
      {(item) => (
        <ItemContent>
          <ItemTitle>{item.name}</ItemTitle>
        </ItemContent>
      )}
    </GenericList>
  );
};
