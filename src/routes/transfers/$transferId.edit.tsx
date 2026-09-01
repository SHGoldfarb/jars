import { createFileRoute } from '@tanstack/react-router';
import { TransfersEdit } from 'src/components/TransfersEdit';

export const Route = createFileRoute('/transfers/$transferId/edit')({
  component: TransfersEdit,
});
