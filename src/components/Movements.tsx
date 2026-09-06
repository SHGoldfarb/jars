import type { MovementListEntry } from 'src/services/finance';
import { useMovements } from 'src/hooks/useMovements';
import { GenericList } from './GenericList';
import { TransactionListItem } from './TransactionListItem';
import { TransferListItem } from './TransferListItem';
import { AllocationListItem } from './AllocationListItem';

// Allocations have no edit route until slice 2, so their rows render un-wrapped.
const movementUrl = (movement: MovementListEntry) => {
  if (movement.movementType === 'transaction') {
    return `/transactions/${movement.id}/edit`;
  }
  if (movement.movementType === 'transfer') {
    return `/transfers/${movement.id}/edit`;
  }
  return undefined;
};

export const Movements = () => {
  const { movements } = useMovements();

  return (
    <GenericList
      items={movements.map((movement) => ({ ...movement, url: movementUrl(movement) }))}
      actions={[
        { label: 'Add transaction', url: '/transactions/new' },
        { label: 'Add transfer', url: '/transfers/new' },
        { label: 'Add allocation', url: '/allocations/new' },
      ]}
    >
      {(item) => {
        if (item.movementType === 'transfer') {
          return <TransferListItem transfer={item} />;
        }
        if (item.movementType === 'allocation') {
          return <AllocationListItem allocation={item} />;
        }
        return <TransactionListItem transaction={item} />;
      }}
    </GenericList>
  );
};
