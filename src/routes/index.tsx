import { createFileRoute } from '@tanstack/react-router';
import { IndexComponent } from './-components';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});
