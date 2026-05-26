import { useTransactions } from 'src/hooks/useTransactions';
import { GenericNameableList } from './GenericNameableList';
import { currency } from 'src/services/finance';

export const Movements = () => {
  const { transactions } = useTransactions();

  return (
    <GenericNameableList
      items={transactions.map((transaction) => ({
        ...transaction,
        name: `${transaction.description} ${currency.stringify(transaction.amount)}`,
        url: `/transactions/${transaction.id}/edit`,
      }))}
      addLabel="Add transaction"
      addUrl="/transactions/new"
    />
  );
};
