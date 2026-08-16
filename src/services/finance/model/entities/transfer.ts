import * as z from 'zod';
import { Movement, idShape } from './shared';

export const Transfer = z.object({
  ...Movement.shape,
  originAccountId: idShape,
  destinationAccountId: idShape,
});

export type Transfer = z.infer<typeof Transfer>;
