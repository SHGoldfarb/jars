import { decimal, type CurrencyAmount } from 'src/services/finance';

interface Archivable {
  archivedAtISO?: string;
}

interface HasJarAndAccount {
  jarId: string;
  accountId: string;
}

interface Dependencies<T extends HasJarAndAccount> {
  restoreJar: (jarId: string) => Promise<void>;
  restoreAccount: (accountId: string) => Promise<void>;
  updateTransaction: (transaction: T) => Promise<void>;
  getJarBalance: (jarId: string) => Promise<CurrencyAmount>;
  getAccountBalance: (accountId: string) => Promise<CurrencyAmount>;
  getJar: (jarId: string) => Promise<Archivable>;
  getAccount: (accountId: string) => Promise<Archivable>;
}

const createGates = <T extends HasJarAndAccount>(deps: Dependencies<T>) => {
  return {
    isJarBalanceNotZero: async (jarId: string) => {
      const balance = await deps.getJarBalance(jarId);
      return decimal.toNumber(balance.amountDecimal) !== 0;
    },
    isJarArchived: async (jarId: string) => {
      const jar = await deps.getJar(jarId);
      return !!jar.archivedAtISO;
    },
    isAccountBalanceNotZero: async (accountId: string) => {
      const balance = await deps.getAccountBalance(accountId);
      return decimal.toNumber(balance.amountDecimal) !== 0;
    },
    isAccountArchived: async (accountId: string) => {
      const account = await deps.getAccount(accountId);
      return !!account.archivedAtISO;
    },
  };
};

const submitEditTransaction = async <T extends HasJarAndAccount>(
  transaction: T,
  deps: Dependencies<T>
) => {
  const { isJarBalanceNotZero, isAccountArchived, isAccountBalanceNotZero, isJarArchived } =
    createGates(deps);

  await deps.updateTransaction(transaction);

  // Restore jar if balance changes to not zero
  if ((await isJarBalanceNotZero(transaction.jarId)) && (await isJarArchived(transaction.jarId))) {
    await deps.restoreJar(transaction.jarId);
  }

  // Restore account if balance changes to not zero
  if (
    (await isAccountBalanceNotZero(transaction.accountId)) &&
    (await isAccountArchived(transaction.accountId))
  ) {
    await deps.restoreAccount(transaction.accountId);
  }
};

export const TransactionFormDomainCommands = {
  submitEditTransaction,
};
