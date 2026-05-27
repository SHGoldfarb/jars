import * as z from 'zod';
import { Archivable, Identifiable, Nameable, ensureActive } from './shared';

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

const NewCategoryInput = z.object({
  id: Identifiable.shape.id,
  name: Nameable.shape.name,
  kind: Category.shape.kind,
});

type NewCategoryInput = z.infer<typeof NewCategoryInput>;

const RenameCategoryInput = z.object({
  name: Nameable.shape.name,
});

type RenameCategoryInput = z.infer<typeof RenameCategoryInput>;

export const createCategory = (input: NewCategoryInput) => Category.parse(input);

export const createIncomeCategory = (input: Omit<NewCategoryInput, 'kind'>) =>
  CategoryIncome.parse({ ...input, kind: 'income' });

export const createExpenseCategory = (input: Omit<NewCategoryInput, 'kind'>) =>
  CategoryExpense.parse({ ...input, kind: 'expense' });

export const renameCategory = (category: Category, input: RenameCategoryInput) => {
  ensureActive(category, 'Category');
  return Category.parse({ ...category, ...RenameCategoryInput.parse(input) });
};

export const archiveCategory = (category: Category, archivedAtISO = new Date().toISOString()) =>
  Category.parse({ ...category, archivedAtISO });
