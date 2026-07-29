import { generateId } from 'src/lib/utils';
import { archiveJar, createJar, renameJar, restoreJar } from '../../model';
import type { FinanceRepositories } from '../../domain';

export const createJarCommands = (deps: FinanceRepositories) => ({
  create: async ({ name }: { name: string }) => {
    const jar = createJar({ id: generateId(), name });
    return deps.jars.save(jar);
  },

  rename: async ({ jarId, name }: { jarId: string; name: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(renameJar(current, { name }));
  },

  archive: async ({ jarId }: { jarId: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(archiveJar(current));
  },

  restore: async ({ jarId }: { jarId: string }) => {
    const current = await deps.jars.getById(jarId);
    return deps.jars.save(restoreJar(current));
  },
});
