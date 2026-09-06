import { createFileRoute } from '@tanstack/react-router';
import { AllocationsEdit } from 'src/components/AllocationsEdit';

export const Route = createFileRoute('/allocations/$allocationId/edit')({
  component: AllocationsEdit,
});
