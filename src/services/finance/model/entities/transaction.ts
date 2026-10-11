import * as z from 'zod';
import { Movement, idShape } from './shared';

export const Transaction = z.object({
  ...Movement.shape,
  kind: z.enum(['income', 'expense']),
  accountId: idShape,
  categoryId: idShape,
  // Optional: a transaction can be saved with a category and no subcategory.
  subcategoryId: idShape.optional(),
  jarId: idShape,
});

export type Transaction = z.infer<typeof Transaction>;
