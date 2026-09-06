import { createFileRoute } from '@tanstack/react-router';
import { AllocationsNew } from 'src/components/AllocationsNew';

export const Route = createFileRoute('/allocations/new')({
  component: AllocationsNew,
});
