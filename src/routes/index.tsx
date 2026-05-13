import { createFileRoute } from '@tanstack/react-router';
import { redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  loader: () => {
    throw redirect({ to: '/movements' });
  },
});
