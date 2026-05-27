import { useTransactions } from 'src/hooks/useTransactions';
import { GenericNameableList } from './GenericNameableList';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';

export const Movements = () => {
  const { transactions } = useTransactions();

  return (
    <GenericNameableList
      items={transactions.map((transaction) => ({
        ...transaction,
        name: `${transaction.description} ${formatCurrencyAmount(transaction.amount)}`,
        url: `/transactions/${transaction.id}/edit`,
      }))}
      addLabel="Add transaction"
      addUrl="/transactions/new"
    />
  );
};
