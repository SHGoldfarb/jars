import { generateId } from 'src/lib/utils';
import { createAccount, getAccounts } from './accounts';

export const initializeMockData = async () => {
  const accounts = await getAccounts();
  if (accounts.length === 0) {
    void createAccount({ id: generateId(), name: 'Wallet' });
    void createAccount({ id: generateId(), name: 'Bank Account' });
    void createAccount({ id: generateId(), name: 'Savings' });
  }
};
