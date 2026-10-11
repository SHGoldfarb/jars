import { generateId } from 'src/lib/utils';
import { financeDomainCommands } from '../../domain';
import type { FinanceRepositories } from '../../domain';

export const createSubcategoryCommands = (deps: FinanceRepositories) => ({
  // The category is read back before the subcategory is created, so a subcategory can never be
  // hung off an id that names nothing.
  create: async ({ categoryId, name }: { categoryId: string; name: string }) => {
    const category = await deps.categories.getById(categoryId);
    const subcategory = financeDomainCommands.subcategories.create({
      id: generateId(),
      name,
      categoryId: category.id,
    });
    return deps.subcategories.save(subcategory);
  },

  rename: async ({ subcategoryId, name }: { subcategoryId: string; name: string }) => {
    const current = await deps.subcategories.getById(subcategoryId);
    return deps.subcategories.save(financeDomainCommands.subcategories.rename(current, { name }));
  },

  archive: async ({ subcategoryId }: { subcategoryId: string }) => {
    const current = await deps.subcategories.getById(subcategoryId);
    return deps.subcategories.save(financeDomainCommands.subcategories.archive(current));
  },
});
