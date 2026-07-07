import {
  decimal,
  financeCommands,
  financeQueries,
  Transaction,
  TransactionUnsaved,
} from 'src/services/finance';

const createTransactionFormCommands = (
  financeQueriesDeps: typeof financeQueries,
  financeCommandsDeps: typeof financeCommands
) => {
  // TODO: this is not very DDD...
  const isJarBalanceNotZero = async (jarId: string) => {
    const balance = await financeQueriesDeps.getJarBalance(jarId);
    return decimal.toNumber(balance.amountDecimal) !== 0;
  };

  const isJarArchived = async (jarId: string) => {
    const jar = await financeQueriesDeps.getJarById(jarId);
    return !!jar.archivedAtISO;
  };

  const isAccountBalanceNotZero = async (accountId: string) => {
    const balance = await financeQueriesDeps.getAccountBalance(accountId);
    return decimal.toNumber(balance.amountDecimal) !== 0;
  };

  const isAccountArchived = async (accountId: string) => {
    const account = await financeQueriesDeps.getAccountById(accountId);
    return !!account.archivedAtISO;
  };

  return {
    submitEditTransaction: async (params: Transaction) => {
      await financeCommandsDeps.updateTransaction(params);

      // Restore jar if balance changes to not zero
      if ((await isJarBalanceNotZero(params.jarId)) && (await isJarArchived(params.jarId))) {
        await financeCommandsDeps.restoreJar({ jarId: params.jarId });
      }

      // Restore account if balance changes to not zero
      if (
        (await isAccountBalanceNotZero(params.accountId)) &&
        (await isAccountArchived(params.accountId))
      ) {
        await financeCommandsDeps.restoreAccount({ accountId: params.accountId });
      }
    },
    submitCreateTransaction: (params: TransactionUnsaved) =>
      financeCommandsDeps.createTransaction(params),
    deleteTransaction: (params: { transactionId: string }) =>
      financeCommandsDeps.archiveTransaction(params),
  };
};

export const transactionFormCommands = createTransactionFormCommands(
  financeQueries,
  financeCommands
);
