import { generateId } from 'src/lib/utils';
import { archiveAccount, createAccount, renameAccount, restoreAccount } from '../../model';
import type { FinanceRepositories } from '../../domain';

export const createAccountCommands = (deps: FinanceRepositories) => ({
  create: async ({ name }: { name: string }) => {
    const account = createAccount({ id: generateId(), name });
    return deps.accounts.save(account);
  },

  rename: async ({ accountId, name }: { accountId: string; name: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(renameAccount(current, { name }));
  },

  archive: async ({ accountId }: { accountId: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(archiveAccount(current));
  },

  restore: async ({ accountId }: { accountId: string }) => {
    const current = await deps.accounts.getById(accountId);
    return deps.accounts.save(restoreAccount(current));
  },
});
