import { createCacheForFunction } from 'src/lib/utils';
import type { Allocation, Transaction, Transfer } from 'src/services/finance';
import { type CurrencyAmount, currency } from 'src/services/shared';

export interface Movements {
  transactions: Transaction[];
  transfers: Transfer[];
  allocations: Allocation[];
}

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

const computeBalances = ({ transactions, transfers, allocations }: Movements) =>
  allocations.reduce(
    applyAllocation,
    transfers.reduce(applyTransfer, transactions.reduce(applyTransaction, emptyBalances()))
  );

// Reading the movements is part of what is cached: the key already names the data state they
// belong to, so a state that was computed before is answered without ever reading them.
const balancesCache = createCacheForFunction(
  async (readMovements: () => Promise<Movements>) => computeBalances(await readMovements()),
  { maxSize: 1 }
);

const createGetters = (balances: Balances) => ({
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
});

export type BalancesGetters = ReturnType<typeof createGetters>;

export const balancesGetters = async ({
  dataStateId,
  readMovements,
}: {
  dataStateId: string;
  readMovements: () => Promise<Movements>;
}): Promise<BalancesGetters> =>
  createGetters(
    await balancesCache.computeWithCache({ key: dataStateId, params: [readMovements] })
  );
