import { createFileRoute } from '@tanstack/react-router';
import { TransactionsEdit } from 'src/components/TransactionsEdit';

export const Route = createFileRoute('/transactions/$transactionId/edit')({
  component: TransactionsEdit,
});
