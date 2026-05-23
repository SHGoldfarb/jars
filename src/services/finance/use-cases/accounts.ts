import { generateId } from 'src/lib/utils';
import { DB } from '../infrastructure';
import { Account } from '../model';

const table = DB.accounts;

export const getAccounts = async ({
  includeArchived = false,
}: { includeArchived?: boolean } = {}) => {
  const accounts = await table.toArray();
  return accounts
    .filter((account) => Account.safeParse(account).success)
    .map((account) => Account.parse(account))
    .filter((account) => includeArchived || !account.archivedAtISO);
};

export const createAccount = async ({ name }: { name: string }) => {
  const parsedAccount = Account.parse({ name, id: generateId() });
  return await table.add(parsedAccount);
};

export const updateAccount = async (account: Account) => {
  const parsedAccount = Account.parse(account);
  return await table.put(parsedAccount);
};

export const archiveAccount = async (accountId: string) => {
  const account = Account.parse(await table.get(accountId));
  account.archivedAtISO = new Date().toISOString();
  return await table.put(account);
};

export const getAccount = async (accountId: string) => {
  return Account.parse(await table.get(accountId));
};
