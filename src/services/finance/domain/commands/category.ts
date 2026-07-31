import * as z from 'zod';
import { Category, CategoryExpense, CategoryIncome } from '../../model';
import { ensureActive } from './shared';

const NewCategoryInput = z.object({
  id: Category.shape.id,
  name: Category.shape.name,
  kind: Category.shape.kind,
});

type NewCategoryInput = z.infer<typeof NewCategoryInput>;

const RenameCategoryInput = z.object({
  name: Category.shape.name,
});

type RenameCategoryInput = z.infer<typeof RenameCategoryInput>;

export const categories = {
  create: (input: NewCategoryInput) => Category.parse(input),
  createIncome: (input: Omit<NewCategoryInput, 'kind'>) =>
    CategoryIncome.parse({ ...input, kind: 'income' }),
  createExpense: (input: Omit<NewCategoryInput, 'kind'>) =>
    CategoryExpense.parse({ ...input, kind: 'expense' }),
  rename: (category: Category, input: RenameCategoryInput) => {
    ensureActive(category, 'Category');
    return Category.parse({ ...category, ...RenameCategoryInput.parse(input) });
  },
  archive: (category: Category, archivedAtISO = new Date().toISOString()) =>
    Category.parse({ ...category, archivedAtISO }),
};
