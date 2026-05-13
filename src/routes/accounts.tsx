import { createFileRoute } from '@tanstack/react-router';
import { Accounts } from './-components';

export const Route = createFileRoute('/accounts')({
  component: Accounts,
});
