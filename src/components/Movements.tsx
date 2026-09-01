import type { MovementListEntry } from 'src/services/finance';
import { useMovements } from 'src/hooks/useMovements';
import { GenericList } from './GenericList';
import { TransactionListItem } from './TransactionListItem';
import { TransferListItem } from './TransferListItem';

const movementUrl = (movement: MovementListEntry) =>
  movement.movementType === 'transaction'
    ? `/transactions/${movement.id}/edit`
    : `/transfers/${movement.id}/edit`;

export const Movements = () => {
  const { movements } = useMovements();

  return (
    <GenericList
      items={movements.map((movement) => ({ ...movement, url: movementUrl(movement) }))}
      actions={[
        { label: 'Add transaction', url: '/transactions/new' },
        { label: 'Add transfer', url: '/transfers/new' },
      ]}
    >
      {(item) =>
        item.movementType === 'transfer' ? (
          <TransferListItem transfer={item} />
        ) : (
          <TransactionListItem transaction={item} />
        )
      }
    </GenericList>
  );
};
