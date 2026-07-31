import { generateId } from 'src/lib/utils';
import { financeDomainCommands } from '../../domain';
import type { FinanceRepositories } from '../../domain';

export const createCategoryCommands = (deps: FinanceRepositories) => ({
  createIncome: async ({ name }: { name: string }) => {
    const category = financeDomainCommands.categories.createIncome({ id: generateId(), name });
    return deps.categories.save(category);
  },

  createExpense: async ({ name }: { name: string }) => {
    const category = financeDomainCommands.categories.createExpense({ id: generateId(), name });
    return deps.categories.save(category);
  },

  rename: async ({ categoryId, name }: { categoryId: string; name: string }) => {
    const current = await deps.categories.getById(categoryId);
    return deps.categories.save(financeDomainCommands.categories.rename(current, { name }));
  },

  archive: async ({ categoryId }: { categoryId: string }) => {
    const current = await deps.categories.getById(categoryId);
    return deps.categories.save(financeDomainCommands.categories.archive(current));
  },
});
