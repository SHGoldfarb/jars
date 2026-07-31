import * as z from 'zod';
import { Archivable, Identifiable, Nameable } from './shared';

export const Account = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  ...Nameable.shape,
});

export type Account = z.infer<typeof Account>;
