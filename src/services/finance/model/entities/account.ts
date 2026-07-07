import * as z from 'zod';
import { Archivable, Identifiable, Nameable, ensureActive } from './shared';

export const Account = z.object({
  ...Archivable.shape,
  ...Identifiable.shape,
  ...Nameable.shape,
});

export type Account = z.infer<typeof Account>;

const NewAccountInput = z.object({
  id: Identifiable.shape.id,
  name: Nameable.shape.name,
});

type NewAccountInput = z.infer<typeof NewAccountInput>;

const RenameAccountInput = z.object({
  name: Nameable.shape.name,
});

type RenameAccountInput = z.infer<typeof RenameAccountInput>;

export const createAccount = (input: NewAccountInput) => Account.parse(input);

export const renameAccount = (account: Account, input: RenameAccountInput) => {
  ensureActive(account, 'Account');
  return Account.parse({ ...account, ...RenameAccountInput.parse(input) });
};

export const archiveAccount = (account: Account, archivedAtISO = new Date().toISOString()) =>
  Account.parse({ ...account, archivedAtISO });

export const restoreAccount = (account: Account) =>
  Account.parse({ ...account, archivedAtISO: undefined });
