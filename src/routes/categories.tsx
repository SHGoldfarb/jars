import { createFileRoute } from '@tanstack/react-router';
import { Categories } from './-components';

export const Route = createFileRoute('/categories')({
  component: Categories,
});
