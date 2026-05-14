import { DB } from '../infrastructure';
import { Account } from '../model';

export const getAccounts = async () => {
  const accounts = await DB.getAccounts();
  return accounts
    .filter((account) => Account.safeParse(account).success)
    .map((account) => Account.parse(account));
};

export const createAccount = async (account: Account) => {
  return await DB.createAccount(account);
};
