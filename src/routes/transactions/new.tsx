import { createFileRoute } from '@tanstack/react-router';
import { TransactionsNew } from 'components/TransactionsNew';

export const Route = createFileRoute('/transactions/new')({
  component: TransactionsNew,
});
