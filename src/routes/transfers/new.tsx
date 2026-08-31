import { createFileRoute } from '@tanstack/react-router';
import { TransfersNew } from 'src/components/TransfersNew';

export const Route = createFileRoute('/transfers/new')({
  component: TransfersNew,
});
