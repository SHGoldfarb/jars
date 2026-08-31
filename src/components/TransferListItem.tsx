import { ArrowLeftRightIcon } from 'lucide-react';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';
import type { Transfer } from 'src/services/finance';
import { useAccount } from 'src/hooks/useAccount';
import { ItemContent, ItemDescription, ItemMedia, ItemTitle } from './ui/item';

export const TransferListItem = ({ transfer }: { transfer: Transfer }) => {
  const originAccount = useAccount(transfer.originAccountId);
  const destinationAccount = useAccount(transfer.destinationAccountId);

  return (
    <>
      <ItemMedia variant="icon">
        <ArrowLeftRightIcon />
      </ItemMedia>
      <ItemContent className="max-w-1/3">
        <ItemTitle>
          {originAccount?.name} → {destinationAccount?.name}
        </ItemTitle>
        <ItemDescription>Transfer</ItemDescription>
      </ItemContent>
      <ItemContent>
        <ItemTitle>{transfer.description}</ItemTitle>
      </ItemContent>
      <ItemContent className="ml-auto items-end">
        <ItemTitle>{formatCurrencyAmount(transfer.amount)}</ItemTitle>
        <ItemDescription>{formatDateISO(transfer.dateISO)}</ItemDescription>
      </ItemContent>
    </>
  );
};
