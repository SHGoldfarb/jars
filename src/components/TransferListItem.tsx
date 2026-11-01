import { ArrowLeftRightIcon } from 'lucide-react';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import type { Transfer } from 'src/services/finance';
import { useAccount } from 'src/hooks/useAccount';
import { MovementListItem } from './MovementListItem';

// Takes what a bookmark carries too, so a bookmark is listed exactly like its movement; without a
// date there is just no time.
export const TransferListItem = ({
  transfer,
}: {
  transfer: Omit<Transfer, 'id' | 'dateISO' | 'archivedAtISO'> & { dateISO?: string };
}) => {
  const originAccount = useAccount(transfer.originAccountId);
  const destinationAccount = useAccount(transfer.destinationAccountId);

  return (
    <MovementListItem
      icon={<ArrowLeftRightIcon />}
      iconClassName="bg-sky-500/15 text-sky-600 dark:text-sky-400"
      kindLabel="Transfer"
      title={transfer.description}
      meta={`${originAccount?.name ?? ''} → ${destinationAccount?.name ?? ''}`}
      amount={formatCurrencyAmount(transfer.amount)}
      dateISO={transfer.dateISO}
    />
  );
};
