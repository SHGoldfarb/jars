import { PiggyBankIcon } from 'lucide-react';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';
import type { Allocation } from 'src/services/finance';
import { useJar } from 'src/hooks/useJar';
import { ItemDescription, ItemTitle } from './ui/item';
import { MovementListItem } from './MovementListItem';

export const AllocationListItem = ({ allocation }: { allocation: Allocation }) => {
  const originJar = useJar(allocation.originJarId);
  const destinationJar = useJar(allocation.destinationJarId);

  return (
    <MovementListItem
      icon={<PiggyBankIcon className="text-violet-400" />}
      contentLeft={
        <>
          <ItemTitle>
            {originJar?.name} → {destinationJar?.name}
          </ItemTitle>
          <ItemDescription>Allocation</ItemDescription>
        </>
      }
      contentMiddle={<ItemTitle>{allocation.description}</ItemTitle>}
      contentRight={
        <>
          <ItemTitle>{formatCurrencyAmount(allocation.amount)}</ItemTitle>
          <ItemDescription>{formatDateISO(allocation.dateISO)}</ItemDescription>
        </>
      }
    />
  );
};
