import { Account, Category, currency, Jar, Transaction } from '../model';
import type { TransactionOrderItem } from './repositories';

const listJars = (jars: Jar[], params: { includeArchived?: boolean }) => {
  const { includeArchived = false } = params;
  return jars.filter((jar) => includeArchived || !jar.archivedAtISO);
};

const listCategories = (categories: Category[], params: { includeArchived?: boolean }) => {
  const { includeArchived = false } = params;
  return categories.filter((category) => includeArchived || !category.archivedAtISO);
};

const listAccounts = (accounts: Account[], params: { includeArchived?: boolean }) => {
  const { includeArchived = false } = params;
  return accounts.filter((account) => includeArchived || !account.archivedAtISO);
};

const orderTransactions = (a: Transaction, b: Transaction, orderItem: TransactionOrderItem) => {
  let result: number | undefined = undefined;
  if (orderItem.dateISO === 'asc') {
    result = a.dateISO.localeCompare(b.dateISO);
  }
  if (orderItem.dateISO === 'desc') {
    result = b.dateISO.localeCompare(a.dateISO);
  }

  return result ?? 0;
};

const listTransactions = (
  transactions: Transaction[],
  params: { includeArchived?: boolean; orderBy?: TransactionOrderItem[] }
) => {
  const { includeArchived = false, orderBy = [{ dateISO: 'desc' }] } = params;
  return transactions
    .filter((transaction) => includeArchived || !transaction.archivedAtISO)
    .sort((a, b) => {
      for (const orderItem of orderBy) {
        const result = orderTransactions(a, b, orderItem);
        if (result !== 0) {
          return result;
        }
      }

      return 0;
    });
};

const getAccountBalance = (accountId: string, transactions: Transaction[]) => {
  const filteredTransactions = listTransactions(transactions, {});
  return filteredTransactions
    .filter((transaction) => transaction.accountId === accountId)
    .reduce(
      (acc, transaction) => {
        if (transaction.kind === 'income') {
          return currency.sum(acc, transaction.amount);
        } else {
          return currency.sum(acc, currency.negate(transaction.amount));
        }
      },
      currency.new(0, 'CLP')
    );
};

export const financeDomainQueries = {
  transactions: {
    list: listTransactions,
  },
  accounts: {
    list: listAccounts,
    balance: getAccountBalance,
  },
  categories: {
    list: listCategories,
  },
  jars: {
    list: listJars,
  },
};
