import { PiggyBankIcon } from 'lucide-react';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import type { Allocation } from 'src/services/finance';
import { useJar } from 'src/hooks/useJar';
import { MovementListItem } from './MovementListItem';

// Takes what a bookmark carries too, so a bookmark is listed exactly like its movement; without a
// date there is just no time.
export const AllocationListItem = ({
  allocation,
}: {
  allocation: Omit<Allocation, 'id' | 'dateISO' | 'archivedAtISO'> & { dateISO?: string };
}) => {
  const originJar = useJar(allocation.originJarId);
  const destinationJar = useJar(allocation.destinationJarId);

  return (
    <MovementListItem
      icon={<PiggyBankIcon />}
      iconClassName="bg-violet-500/15 text-violet-600 dark:text-violet-400"
      kindLabel="Allocation"
      title={allocation.description}
      meta={`${originJar?.name ?? ''} → ${destinationJar?.name ?? ''}`}
      amount={formatCurrencyAmount(allocation.amount)}
      dateISO={allocation.dateISO}
    />
  );
};
