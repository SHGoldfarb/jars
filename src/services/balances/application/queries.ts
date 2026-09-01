import { financeQueries } from 'src/services/finance';
import { createBalancesGetters } from '../domain/queries';

const createBalanceQueries = (financeQueriesDeps: typeof financeQueries) => {
  const getBalances = async () => {
    const transactions = await financeQueriesDeps.transactions.list();
    const transfers = await financeQueriesDeps.transfers.list();
    const dataStateId = [
      financeQueriesDeps.transactions.lastOperationId(),
      financeQueriesDeps.transfers.lastOperationId(),
    ].join(':');
    return createBalancesGetters({ transactions, transfers, dataStateId });
  };

  return {
    accounts: async (accountId: string) => {
      return (await getBalances()).accounts(accountId);
    },
    jars: async (jarId: string) => {
      return (await getBalances()).jars(jarId);
    },
  };
};

export const balanceQueries = createBalanceQueries(financeQueries);
