import { getAccounts } from 'src/services/finance';
import { useLiveQuery } from 'dexie-react-hooks';

export const useAccounts = () => {
  const accounts = useLiveQuery(getAccounts);
  const loading = accounts === undefined;

  return { accounts: accounts ?? [], loading };
};
