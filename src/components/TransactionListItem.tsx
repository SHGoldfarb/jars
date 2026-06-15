import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { ItemContent, ItemDescription, ItemMedia, ItemTitle } from './ui/item';
import { CircleDollarSignIcon } from 'lucide-react';
import type { Transaction } from 'src/services/finance';
import { useJar } from 'src/hooks/useJar';
import { useCategory } from 'src/hooks/useCategory';
import { useAccount } from 'src/hooks/useAccount';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';

export const TransactionListItem = ({ transaction }: { transaction: Transaction }) => {
  const jar = useJar(transaction.jarId);
  const category = useCategory(transaction.categoryId);
  const account = useAccount(transaction.accountId);
  return (
    <>
      <ItemMedia variant="icon">
        <CircleDollarSignIcon />
      </ItemMedia>
      <ItemContent className="max-w-1/4">
        <ItemTitle>{account?.name}</ItemTitle>
        <ItemDescription>{jar?.name} </ItemDescription>
      </ItemContent>
      <ItemContent>
        <ItemTitle>{transaction.description}</ItemTitle>
        <ItemDescription>{category?.name} </ItemDescription>
      </ItemContent>
      <ItemContent className="ml-auto items-end">
        <ItemTitle>{formatCurrencyAmount(transaction.amount)}</ItemTitle>
        <ItemDescription>{formatDateISO(transaction.dateISO)} </ItemDescription>
      </ItemContent>
    </>
  );
};
