import { createFileRoute } from '@tanstack/react-router';
import { JarsNew } from 'components/JarsNew';

export const Route = createFileRoute('/jars/new')({
  component: JarsNew,
});
