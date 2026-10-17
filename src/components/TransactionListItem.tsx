import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { ItemDescription, ItemTitle } from './ui/item';
import { CircleDollarSignIcon } from 'lucide-react';
import type { Transaction } from 'src/services/finance';
import { useJar } from 'src/hooks/useJar';
import { useCategory } from 'src/hooks/useCategory';
import { useSubcategory } from 'src/hooks/useSubcategory';
import { useAccount } from 'src/hooks/useAccount';
import { formatDateISO } from 'src/presentation/formatters/dateFormatters';
import { MovementListItem } from './MovementListItem';

// Takes what a bookmark carries too, so a bookmark is listed exactly like its movement; without a
// date there is just no date line.
export const TransactionListItem = ({
  transaction,
}: {
  transaction: Omit<Transaction, 'id' | 'dateISO' | 'archivedAtISO'> & { dateISO?: string };
}) => {
  const jar = useJar(transaction.jarId);
  const category = useCategory(transaction.categoryId);
  const subcategory = useSubcategory(transaction.subcategoryId ?? '');
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
          <ItemDescription>
            {category?.name}
            {subcategory ? ` · ${subcategory.name}` : null}
          </ItemDescription>
        </>
      }
      contentRight={
        <>
          <ItemTitle className={kindColor}>{formatCurrencyAmount(transaction.amount)}</ItemTitle>
          {transaction.dateISO ? (
            <ItemDescription>{formatDateISO(transaction.dateISO)}</ItemDescription>
          ) : null}
        </>
      }
    />
  );
};
