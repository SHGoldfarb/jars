import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { ItemDescription, ItemTitle } from './ui/item';
import { CircleDollarSignIcon } from 'lucide-react';
import type { Transaction } from 'src/services/finance';
import { useJar } from 'src/hooks/useJar';
import { useCategory } from 'src/hooks/useCategory';
import { useAccount } from 'src/hooks/useAccount';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';
import { MovementListItem } from './MovementListItem';

export const TransactionListItem = ({ transaction }: { transaction: Transaction }) => {
  const jar = useJar(transaction.jarId);
  const category = useCategory(transaction.categoryId);
  const account = useAccount(transaction.accountId);
  const kindColor = transaction.kind === 'income' ? 'text-emerald-400' : 'text-rose-400';

  return (
    <MovementListItem
      icon={<CircleDollarSignIcon className={kindColor} />}
      contentLeft={
        <>
          <ItemTitle>
            {account?.name} · {jar?.name}
          </ItemTitle>
          <ItemDescription>Transaction</ItemDescription>
        </>
      }
      contentMiddle={
        <>
          <ItemTitle>{transaction.description}</ItemTitle>
          <ItemDescription>{category?.name}</ItemDescription>
        </>
      }
      contentRight={
        <>
          <ItemTitle className={kindColor}>{formatCurrencyAmount(transaction.amount)}</ItemTitle>
          <ItemDescription>{formatDateISO(transaction.dateISO)}</ItemDescription>
        </>
      }
    />
  );
};
