import { createFileRoute } from '@tanstack/react-router';
import { Movements } from './-components';

export const Route = createFileRoute('/movements')({
  component: Movements,
});
