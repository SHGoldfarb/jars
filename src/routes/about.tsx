import { createFileRoute } from '@tanstack/react-router';
import { About } from './-components';

export const Route = createFileRoute('/about')({
  component: About,
});
