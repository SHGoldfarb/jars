import * as z from 'zod';
import { Account } from '../../model';
import { ensureActive } from './shared';

const NewAccountInput = z.object({
  id: Account.shape.id,
  name: Account.shape.name,
});

type NewAccountInput = z.infer<typeof NewAccountInput>;

const RenameAccountInput = z.object({
  name: Account.shape.name,
});

type RenameAccountInput = z.infer<typeof RenameAccountInput>;

export const accounts = {
  create: (input: NewAccountInput) => Account.parse(input),
  rename: (account: Account, input: RenameAccountInput) => {
    ensureActive(account, 'Account');
    return Account.parse({ ...account, ...RenameAccountInput.parse(input) });
  },
  archive: (account: Account, archivedAtISO = new Date().toISOString()) =>
    Account.parse({ ...account, archivedAtISO }),
  restore: (account: Account) => Account.parse({ ...account, archivedAtISO: undefined }),
};
