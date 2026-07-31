import { generateId } from 'src/lib/utils';
import { financeDomainCommands } from '../../domain';
import type { FinanceRepositories } from '../../domain';

export const createJarCommands = (deps: FinanceRepositories) => ({
  create: async ({ name }: { name: string }) => {
    const jar = financeDomainCommands.jars.create({ id: generateId(), name });
    return deps.jars.save(jar);
  },

  rename: async ({ jarId, name }: { jarId: string; name: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(financeDomainCommands.jars.rename(current, { name }));
  },

  archive: async ({ jarId }: { jarId: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(financeDomainCommands.jars.archive(current));
  },

  restore: async ({ jarId }: { jarId: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(financeDomainCommands.jars.restore(current));
  },
});
