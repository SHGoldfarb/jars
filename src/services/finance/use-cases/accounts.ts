import { generateId } from 'src/lib/utils';
import { DB } from '../infrastructure';
import { Account } from '../model';

const table = DB.accounts;

export const getAccounts = async ({
  includeArchived = false,
}: { includeArchived?: boolean } = {}) => {
  const accounts = await table.getMap();
  return Object.values(accounts)
    .filter((account) => Account.safeParse(account).success)
    .map((account) => Account.parse(account))
    .filter((account) => includeArchived || !account.archivedAtISO);
};

export const createAccount = async ({ name }: { name: string }) => {
  const parsedAccount = Account.parse({ name, id: generateId() });
  return table.upsert(parsedAccount);
};

export const updateAccount = async (account: Account) => {
  const parsedAccount = Account.parse(account);
  return table.upsert(parsedAccount);
};

export const getAccount = async (accountId: string) => {
  return Account.parse((await table.getMap())[accountId]);
};

export const archiveAccount = async (accountId: string) => {
  const account = await getAccount(accountId);
  account.archivedAtISO = new Date().toISOString();
  return table.upsert(account);
};
