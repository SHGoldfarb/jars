import * as z from 'zod';
import { Movement, idShape } from './shared';

export const Transaction = z.object({
  ...Movement.shape,
  kind: z.enum(['income', 'expense']),
  accountId: idShape,
  categoryId: idShape,
  jarId: idShape,
});

export type Transaction = z.infer<typeof Transaction>;
