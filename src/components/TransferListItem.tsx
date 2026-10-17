import { ArrowLeftRightIcon } from 'lucide-react';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';
import type { Transfer } from 'src/services/finance';
import { useAccount } from 'src/hooks/useAccount';
import { ItemDescription, ItemTitle } from './ui/item';
import { MovementListItem } from './MovementListItem';

// Takes what a bookmark carries too, so a bookmark is listed exactly like its movement; without a
// date there is just no date line.
export const TransferListItem = ({
  transfer,
}: {
  transfer: Omit<Transfer, 'id' | 'dateISO' | 'archivedAtISO'> & { dateISO?: string };
}) => {
  const originAccount = useAccount(transfer.originAccountId);
  const destinationAccount = useAccount(transfer.destinationAccountId);

  return (
    <MovementListItem
      icon={<ArrowLeftRightIcon className="text-sky-400" />}
      contentLeft={
        <>
          <ItemTitle>
            {originAccount?.name} → {destinationAccount?.name}
          </ItemTitle>
          <ItemDescription>Transfer</ItemDescription>
        </>
      }
      contentMiddle={<ItemTitle>{transfer.description}</ItemTitle>}
      contentRight={
        <>
          <ItemTitle>{formatCurrencyAmount(transfer.amount)}</ItemTitle>
          {transfer.dateISO ? (
            <ItemDescription>{formatDateISO(transfer.dateISO)}</ItemDescription>
          ) : null}
        </>
      }
    />
  );
};
