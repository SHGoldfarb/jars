import { useTransactions } from 'src/hooks/useTransactions';
import { GenericList } from './GenericList';
import { TransactionListItem } from './TransactionListItem';

export const Movements = () => {
  const { transactions } = useTransactions();

  return (
    <GenericList
      items={transactions.map((transaction) => ({
        ...transaction,
        url: `/transactions/${transaction.id}/edit`,
      }))}
      addLabel="Add transaction"
      addUrl="/transactions/new"
    >
      {(transaction) => <TransactionListItem transaction={transaction} />}
    </GenericList>
  );
};
