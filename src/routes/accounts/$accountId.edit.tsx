import { createFileRoute } from '@tanstack/react-router';
import { AccountsEdit } from 'components/AccountsEdit';

export const Route = createFileRoute('/accounts/$accountId/edit')({
  component: AccountsEdit,
});
