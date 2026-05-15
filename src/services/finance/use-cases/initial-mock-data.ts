import { createAccount, getAccounts } from './accounts';

export const initializeMockData = async () => {
  const accounts = await getAccounts();
  if (accounts.length === 0) {
    void createAccount({ name: 'Wallet' });
    void createAccount({ name: 'Bank Account' });
    void createAccount({ name: 'Savings' });
  }
};
