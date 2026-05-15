import { getAccount } from 'src/services/finance';
import { useLiveQuery } from 'dexie-react-hooks';

export const useAccount = (accountId: string) =>
  useLiveQuery(() => getAccount(accountId), [accountId]);
