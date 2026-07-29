import { generateId } from 'src/lib/utils';
import {
  archiveCategory,
  createExpenseCategory,
  createIncomeCategory,
  renameCategory,
} from '../../model';
import type { FinanceRepositories } from '../../domain';

export const createCategoryCommands = (deps: FinanceRepositories) => ({
  createIncome: async ({ name }: { name: string }) => {
    const category = createIncomeCategory({ id: generateId(), name });
    return deps.categories.save(category);
  },

  createExpense: async ({ name }: { name: string }) => {
    const category = createExpenseCategory({ id: generateId(), name });
    return deps.categories.save(category);
  },

  rename: async ({ categoryId, name }: { categoryId: string; name: string }) => {
    const current = await deps.categories.getById(categoryId);
    return deps.categories.save(renameCategory(current, { name }));
  },

  archive: async ({ categoryId }: { categoryId: string }) => {
    const current = await deps.categories.getById(categoryId);
    return deps.categories.save(archiveCategory(current));
  },
});
