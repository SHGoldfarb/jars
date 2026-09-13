import { financeQueries } from 'src/services/finance';
import { cachedBalancesGetters, createBalancesGetters } from '../domain/queries';

const createBalanceQueries = (financeQueriesDeps: typeof financeQueries) => {
  // The operation ids identify the data the balances are computed from, so they are read first:
  // when they already name a computed state, the movements themselves are never read.
  const currentDataStateId = () =>
    [
      financeQueriesDeps.transactions.lastOperationId(),
      financeQueriesDeps.transfers.lastOperationId(),
      financeQueriesDeps.allocations.lastOperationId(),
    ].join(':');

  const getBalances = async () => {
    // TODO: have a lock in balances compute, so that if it's called multiple times at the same time,
    // it's only computed once and they all hit that cache.
    const dataStateId = currentDataStateId();
    // TODO: this should be a cached function that includes the movements fetching inside the function, so that
    // manually checking for cached value is not necessary.
    const cached = cachedBalancesGetters(dataStateId);
    if (cached) {
      return cached;
    }
    const transactions = await financeQueriesDeps.transactions.list();
    const transfers = await financeQueriesDeps.transfers.list();
    const allocations = await financeQueriesDeps.allocations.list();
    return createBalancesGetters({ transactions, transfers, allocations, dataStateId });
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
