import type { Allocation, Transaction, Transfer } from '../model';
import type { CurrencyAmount } from '../../shared';
import { currencies } from '../../shared';
import { validateApplicationState } from '../policies';

interface Balances {
  accounts: Record<string, CurrencyAmount>;
  jars: Record<string, CurrencyAmount>;
}

const addToRecord = <K extends string>(
  record: Record<K, CurrencyAmount>,
  key: K,
  delta: CurrencyAmount
) => {
  const current = record[key];
  record[key] = currencies.sum(current, delta);
};

export const computeBalances = (
  transactions: Transaction[],
  transfers: Transfer[],
  allocations: Allocation[]
): Balances => {
  validateApplicationState(allocations, transfers, transactions);

  const accounts = {} as Record<string, CurrencyAmount>;
  const jars = {} as Record<string, CurrencyAmount>;

  for (const tx of transactions) {
    const signedAmount = tx.kind === 'income' ? tx.amount : currencies.negate(tx.amount);
    addToRecord(accounts, tx.accountId, signedAmount);
    addToRecord(jars, tx.jarId, signedAmount);
  }

  for (const transfer of transfers) {
    addToRecord(accounts, transfer.originAccountId, currencies.negate(transfer.amount));
    addToRecord(accounts, transfer.destinationAccountId, transfer.amount);
  }

  for (const allocation of allocations) {
    addToRecord(jars, allocation.originJarId, currencies.negate(allocation.amount));
    addToRecord(jars, allocation.destinationJarId, allocation.amount);
  }

  return { accounts, jars };
};
