import { createFileRoute } from '@tanstack/react-router';
import { JarsEdit } from 'components/JarsEdit';

export const Route = createFileRoute('/jars/$jarId/edit')({
  component: JarsEdit,
});
