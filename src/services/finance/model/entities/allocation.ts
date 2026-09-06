import * as z from 'zod';
import { Movement, idShape } from './shared';

export const Allocation = z.object({
  ...Movement.shape,
  originJarId: idShape,
  destinationJarId: idShape,
});

export type Allocation = z.infer<typeof Allocation>;
