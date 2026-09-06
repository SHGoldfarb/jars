import { createCacheForFunction } from 'src/lib/utils';
import type { Allocation, Transaction, Transfer } from 'src/services/finance';
import { type CurrencyAmount, currency } from 'src/services/shared';

const emptyBalances = () => ({
  jars: {} as Record<string, CurrencyAmount>,
  accounts: {} as Record<string, CurrencyAmount>,
});

type Balances = ReturnType<typeof emptyBalances>;

const addTo = (holders: Record<string, CurrencyAmount>, id: string, amount: CurrencyAmount) => {
  const current = id in holders ? holders[id] : currency.new(0, 'CLP');
  holders[id] = currency.sum(current, amount);
};

const applyTransaction = (balances: Balances, transaction: Transaction) => {
  const amount =
    transaction.kind === 'income' ? transaction.amount : currency.negate(transaction.amount);

  addTo(balances.jars, transaction.jarId, amount);
  addTo(balances.accounts, transaction.accountId, amount);

  return balances;
};

// A transfer moves money between accounts, so it leaves jar balances untouched.
const applyTransfer = (balances: Balances, transfer: Transfer) => {
  addTo(balances.accounts, transfer.originAccountId, currency.negate(transfer.amount));
  addTo(balances.accounts, transfer.destinationAccountId, transfer.amount);

  return balances;
};

// An allocation moves money between jars, so it leaves account balances untouched.
const applyAllocation = (balances: Balances, allocation: Allocation) => {
  addTo(balances.jars, allocation.originJarId, currency.negate(allocation.amount));
  addTo(balances.jars, allocation.destinationJarId, allocation.amount);

  return balances;
};

const computeBalancesUncached = (
  transactions: Transaction[],
  transfers: Transfer[],
  allocations: Allocation[]
) =>
  allocations.reduce(
    applyAllocation,
    transfers.reduce(applyTransfer, transactions.reduce(applyTransaction, emptyBalances()))
  );

const computeBalancesWithManualCache = createCacheForFunction(computeBalancesUncached, {
  maxSize: 1,
});

export const createBalancesGetters = ({
  dataStateId,
  transactions,
  transfers,
  allocations,
}: {
  transactions: Transaction[];
  transfers: Transfer[];
  allocations: Allocation[];
  dataStateId: string;
}) => {
  const balances = computeBalancesWithManualCache({
    key: dataStateId,
    params: [transactions, transfers, allocations],
  });

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
