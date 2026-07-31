import * as z from 'zod';
import { CurrencyAmount } from '../currency';
import { Archivable, Identifiable, dateTimeShape, idShape } from './shared';

export const Transaction = z.object({
  ...Identifiable.shape,
  ...Archivable.shape,
  kind: z.enum(['income', 'expense']),
  accountId: idShape,
  categoryId: idShape,
  jarId: idShape,
  amount: CurrencyAmount,
  dateISO: dateTimeShape,
  description: z.string().trim(),
});

export type Transaction = z.infer<typeof Transaction>;
