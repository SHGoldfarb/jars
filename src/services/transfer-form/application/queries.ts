import { financeQueries } from 'src/services/finance';

const createTransferFormQueries = (financeQueriesDeps: typeof financeQueries) => {
  return {
    // Gets the options that should be shown in the transfer form account selectors:
    // The non archived accounts + the origin/destination accounts of the transfer being edited,
    // even if they are archived.
    getAccountsForSelector: async (transferId: string | undefined) => {
      const accounts = await financeQueriesDeps.accounts.list();
      if (transferId) {
        const transfer = await financeQueriesDeps.transfers.getById(transferId);
        const accountIds = accounts.map(({ id }) => id);
        const missingIds = [transfer.originAccountId, transfer.destinationAccountId].filter(
          (id) => !accountIds.includes(id)
        );
        if (missingIds.length > 0) {
          const missingAccounts = await Promise.all(
            missingIds.map((id) => financeQueriesDeps.accounts.getById(id))
          );
          return [...missingAccounts, ...accounts];
        }
      }
      return accounts;
    },
  };
};

export const transferFormQueries = createTransferFormQueries(financeQueries);
