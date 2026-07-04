import { financeQueries } from 'src/services/finance';

const createTransactionFormQueries = (financeQueriesDeps: typeof financeQueries) => {
  return {
    // Gets the options that should be shown in the transaction form accounts selector:
    // The non archived accounts + the account the transaction being edited already belongs to,
    // even if it is archived.
    getAccountsForSelector: async (transactionId: string | undefined) => {
      const accounts = await financeQueriesDeps.listAccounts();
      if (transactionId) {
        const transaction = await financeQueries.getTransactionById(transactionId);
        const isTransactionAccountIncluded = accounts
          .map(({ id }) => id)
          .includes(transaction.accountId);
        if (!isTransactionAccountIncluded) {
          const transactionAccount = await financeQueriesDeps.getAccountById(transaction.accountId);
          return [transactionAccount, ...accounts];
        }
      }
      return accounts;
    },

    // Gets the options that should be shown in the transaction form jars selector:
    // The non archived jars + the jar the transaction being edited already belongs to,
    // even if it is archived.
    getJarsForSelector: async (transactionId: string | undefined) => {
      const jars = await financeQueriesDeps.listJars();
      if (transactionId) {
        const transaction = await financeQueries.getTransactionById(transactionId);
        const isTransactionJarIncluded = jars.map(({ id }) => id).includes(transaction.jarId);
        if (!isTransactionJarIncluded) {
          const transactionJar = await financeQueriesDeps.getJarById(transaction.jarId);
          return [transactionJar, ...jars];
        }
      }
      return jars;
    },

    // Gets the options that should be shown in the transaction form categories selector:
    // The non archived categories (of the given kind) + the category the transaction being edited
    // already belongs to, even if it is archived.
    getCategoriesForSelector: async (
      kind: 'income' | 'expense',
      transactionId: string | undefined
    ) => {
      const categories =
        kind === 'income'
          ? await financeQueriesDeps.listCategoriesIncome()
          : await financeQueriesDeps.listCategoriesExpense();
      if (transactionId) {
        const transaction = await financeQueries.getTransactionById(transactionId);
        const isTransactionCategoryIncluded = categories
          .map(({ id }) => id)
          .includes(transaction.categoryId);
        if (kind === transaction.kind && !isTransactionCategoryIncluded) {
          const transactionCategory = await financeQueriesDeps.getCategoryById(
            transaction.categoryId
          );
          return [transactionCategory, ...categories];
        }
      }
      return categories;
    },
  };
};

export const transactionFormQueries = createTransactionFormQueries(financeQueries);
