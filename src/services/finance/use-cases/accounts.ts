import { generateId } from 'src/lib/utils';
import { DB } from '../infrastructure';
import { Account } from '../model';

export const getAccounts = async () => {
  const accounts = await DB.getAccounts();
  return accounts
    .filter((account) => Account.safeParse(account).success)
    .map((account) => Account.parse(account));
};

export const createAccount = async ({ name }: { name: string }) => {
  const parsedAccount = Account.parse({ name, id: generateId() });
  return await DB.createAccount(parsedAccount);
};
