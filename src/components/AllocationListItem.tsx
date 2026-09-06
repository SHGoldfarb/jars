import { PiggyBankIcon } from 'lucide-react';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';
import type { Allocation } from 'src/services/finance';
import { useJar } from 'src/hooks/useJar';
import { ItemContent, ItemDescription, ItemMedia, ItemTitle } from './ui/item';

export const AllocationListItem = ({ allocation }: { allocation: Allocation }) => {
  const originJar = useJar(allocation.originJarId);
  const destinationJar = useJar(allocation.destinationJarId);

  return (
    <>
      <ItemMedia variant="icon">
        <PiggyBankIcon />
      </ItemMedia>
      <ItemContent className="max-w-1/3">
        <ItemTitle>
          {originJar?.name} → {destinationJar?.name}
        </ItemTitle>
        <ItemDescription>Allocation</ItemDescription>
      </ItemContent>
      <ItemContent>
        <ItemTitle>{allocation.description}</ItemTitle>
      </ItemContent>
      <ItemContent className="ml-auto items-end">
        <ItemTitle>{formatCurrencyAmount(allocation.amount)}</ItemTitle>
        <ItemDescription>{formatDateISO(allocation.dateISO)}</ItemDescription>
      </ItemContent>
    </>
  );
};
