import { generateId } from 'src/lib/utils';
import { financeDomainCommands } from '../../domain';
import type { FinanceRepositories } from '../../domain';

export const createAccountCommands = (deps: FinanceRepositories) => ({
  create: async ({ name }: { name: string }) => {
    const account = financeDomainCommands.accounts.create({ id: generateId(), name });
    return deps.accounts.save(account);
  },

  rename: async ({ accountId, name }: { accountId: string; name: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(financeDomainCommands.accounts.rename(current, { name }));
  },

  archive: async ({ accountId }: { accountId: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(financeDomainCommands.accounts.archive(current));
  },

  restore: async ({ accountId }: { accountId: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(financeDomainCommands.accounts.restore(current));
  },
});
