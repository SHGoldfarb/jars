import { createFileRoute } from '@tanstack/react-router';
import { Categories } from 'src/components/Categories';

export const Route = createFileRoute('/categories')({
  component: Categories,
});
