import { ItemContent, ItemTitle } from 'components/ui/item';
import { GenericList, type GenericListAction } from './GenericList';

export const GenericNameableList = ({
  items,
  actions,
}: {
  items: { name: string; id: string; url: string }[];
  actions: GenericListAction[];
}) => {
  return (
    <GenericList items={items} actions={actions}>
      {(item) => (
        <ItemContent>
          <ItemTitle>{item.name}</ItemTitle>
        </ItemContent>
      )}
    </GenericList>
  );
};
