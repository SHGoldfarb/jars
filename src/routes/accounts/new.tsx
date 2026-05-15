import { createFileRoute } from '@tanstack/react-router';
import { AccountsNew } from 'components/AccountsNew';

export const Route = createFileRoute('/accounts/new')({
  component: AccountsNew,
});
