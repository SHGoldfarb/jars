import * as z from 'zod';
import { Archivable, Identifiable, Nameable } from './shared';

export const Category = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  ...Nameable.shape,
  kind: z.enum(['income', 'expense']),
});

export type Category = z.infer<typeof Category>;

export const CategoryIncome = z.object({
  ...Category.shape,
  kind: z.literal('income'),
});

export type CategoryIncome = z.infer<typeof CategoryIncome>;

export const CategoryExpense = z.object({
  ...Category.shape,
  kind: z.literal('expense'),
});

export type CategoryExpense = z.infer<typeof CategoryExpense>;
