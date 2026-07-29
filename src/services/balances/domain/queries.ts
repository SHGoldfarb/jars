import { createCacheForFunction } from 'src/lib/utils';
import { type Transaction, type CurrencyAmount, currency } from 'src/services/finance';

const emptyBalances = () => ({
  jars: {} as Record<string, CurrencyAmount>,
  accounts: {} as Record<string, CurrencyAmount>,
});

const computeBalancesUncached = (transactions: Transaction[]) =>
  transactions.reduce((balances, transaction) => {
    const { jars, accounts } = balances;
    if (!(transaction.jarId in jars)) {
      jars[transaction.jarId] = currency.new(0, 'CLP');
    }

    if (!(transaction.accountId in accounts)) {
      accounts[transaction.accountId] = currency.new(0, 'CLP');
    }

    const amount =
      transaction.kind === 'income' ? transaction.amount : currency.negate(transaction.amount);

    jars[transaction.jarId] = currency.sum(jars[transaction.jarId], amount);
    accounts[transaction.accountId] = currency.sum(accounts[transaction.accountId], amount);

    return balances;
  }, emptyBalances());

const computeBalancesWithManualCache = createCacheForFunction(computeBalancesUncached);

export const createBalancesGetters = ({
  dataStateId,
  transactions,
}: {
  transactions: Transaction[];
  dataStateId: number;
}) => {
  const balances = computeBalancesWithManualCache(dataStateId.toString(), [transactions]);

  return {
    jars: (jarId: string) => {
      if (jarId in balances.jars) {
        return balances.jars[jarId];
      }
      return currency.new(0, 'CLP');
    },
    accounts: (accountId: string) => {
      if (accountId in balances.accounts) {
        return balances.accounts[accountId];
      }
      return currency.new(0, 'CLP');
    },
  };
};
