import { createFileRoute } from '@tanstack/react-router';
import { Jars } from 'src/components/Jars';

export const Route = createFileRoute('/jars/')({
  component: Jars,
});
