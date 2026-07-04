import { financeQueries } from 'src/services/finance';

const createTransactionFormQueries = (financeQueriesDeps: typeof financeQueries) => {
  return {
    // Gets the options that should be shown in the transaction form accounts selector:
    // The non archived accounts + the account the transaction being edited already belongs to,
    // even if it is archived.
    getAccountsForSelector: async (transactionId: string | undefined) => {
      const accounts = await financeQueriesDeps.listAccounts();
      if (transactionId) {
        const transaction = await financeQueries.getTransactionById(transactionId);
        const isTransactionAccountIncluded = accounts
          .map(({ id }) => id)
          .includes(transaction.accountId);
        if (!isTransactionAccountIncluded) {
          const transactionAccount = await financeQueriesDeps.getAccountById(transaction.accountId);
          return [transactionAccount, ...accounts];
        }
      }
      return accounts;
    },
  };
};

export const transactionFormQueries = createTransactionFormQueries(financeQueries);
