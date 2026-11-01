import { formatSignedCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import { CircleDollarSignIcon } from 'lucide-react';
import type { Transaction } from 'src/services/finance';
import { useJar } from 'src/hooks/useJar';
import { useCategory } from 'src/hooks/useCategory';
import { useSubcategory } from 'src/hooks/useSubcategory';
import { useAccount } from 'src/hooks/useAccount';
import { MovementListItem } from './MovementListItem';

// Takes what a bookmark carries too, so a bookmark is listed exactly like its movement; without a
// date there is just no time.
export const TransactionListItem = ({
  transaction,
}: {
  transaction: Omit<Transaction, 'id' | 'dateISO' | 'archivedAtISO'> & { dateISO?: string };
}) => {
  const jar = useJar(transaction.jarId);
  const category = useCategory(transaction.categoryId);
  const subcategory = useSubcategory(transaction.subcategoryId ?? '');
  const account = useAccount(transaction.accountId);
  const isIncome = transaction.kind === 'income';

  return (
    <MovementListItem
      icon={<CircleDollarSignIcon />}
      iconClassName={
        isIncome
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
      }
      kindLabel="Transaction"
      title={transaction.description}
      meta={[category?.name, subcategory?.name, account?.name, jar?.name]
        .filter((part) => part)
        .join(' · ')}
      amount={formatSignedCurrencyAmount(transaction.amount, isIncome ? 'in' : 'out')}
      amountClassName={isIncome ? 'text-emerald-600 dark:text-emerald-400' : undefined}
      dateISO={transaction.dateISO}
    />
  );
};
