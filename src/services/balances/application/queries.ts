import { financeQueries } from 'src/services/finance';
import { currency } from 'src/services/shared';
import { balancesGetters } from '../domain/queries';

const createBalanceQueries = (financeQueriesDeps: typeof financeQueries) => {
  // The operation ids identify the data the balances are computed from, so they are read first:
  // when they already name a computed state, the movements themselves are never read.
  const currentDataStateId = () =>
    [
      financeQueriesDeps.transactions.lastOperationId(),
      financeQueriesDeps.transfers.lastOperationId(),
      financeQueriesDeps.allocations.lastOperationId(),
    ].join(':');

  const readMovements = async () => ({
    transactions: await financeQueriesDeps.transactions.list(),
    transfers: await financeQueriesDeps.transfers.list(),
    allocations: await financeQueriesDeps.allocations.list(),
  });

  // Balances are computed under the cache's own lock, so concurrent callers never compute twice.
  const getBalances = () => balancesGetters({ dataStateId: currentDataStateId(), readMovements });

  return {
    accounts: async (accountId: string) => {
      return (await getBalances()).accounts(accountId);
    },
    jars: async (jarId: string) => {
      return (await getBalances()).jars(jarId);
    },
    // What the given accounts hold between them - the ones a list is showing, say.
    accountsTotal: async (accountIds: readonly string[]) => {
      const getters = await getBalances();
      return accountIds.map(getters.accounts).reduce(currency.sum, currency.new(0, 'CLP'));
    },
    // What the given jars hold between them.
    jarsTotal: async (jarIds: readonly string[]) => {
      const getters = await getBalances();
      return jarIds.map(getters.jars).reduce(currency.sum, currency.new(0, 'CLP'));
    },
  };
};

export const balanceQueries = createBalanceQueries(financeQueries);
