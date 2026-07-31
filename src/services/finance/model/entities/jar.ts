import * as z from 'zod';
import { Archivable, Identifiable, Nameable } from './shared';

export const Jar = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  ...Nameable.shape,
});

export type Jar = z.infer<typeof Jar>;
