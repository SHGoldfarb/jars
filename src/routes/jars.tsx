import { createFileRoute } from '@tanstack/react-router';
import { Jars } from './-components';

export const Route = createFileRoute('/jars')({
  component: Jars,
});
