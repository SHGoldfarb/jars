import { createFileRoute } from '@tanstack/react-router';
import { Movements } from 'src/components/Movements';

export const Route = createFileRoute('/movements')({
  component: Movements,
});
