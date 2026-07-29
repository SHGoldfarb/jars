import { financeQueries } from 'src/services/finance';

const createTransactionFormQueries = (financeQueriesDeps: typeof financeQueries) => {
  return {
    // Gets the options that should be shown in the transaction form accounts selector:
    // The non archived accounts + the account the transaction being edited already belongs to,
    // even if it is archived.
    getAccountsForSelector: async (transactionId: string | undefined) => {
      const accounts = await financeQueriesDeps.accounts.list();
      if (transactionId) {
        const transaction = await financeQueries.transactions.getById(transactionId);
        const isTransactionAccountIncluded = accounts
          .map(({ id }) => id)
          .includes(transaction.accountId);
        if (!isTransactionAccountIncluded) {
          const transactionAccount = await financeQueriesDeps.accounts.getById(
            transaction.accountId
          );
          return [transactionAccount, ...accounts];
        }
      }
      return accounts;
    },

    // Gets the options that should be shown in the transaction form jars selector:
    // The non archived jars + the jar the transaction being edited already belongs to,
    // even if it is archived.
    getJarsForSelector: async (transactionId: string | undefined) => {
      const jars = await financeQueriesDeps.jars.list();
      if (transactionId) {
        const transaction = await financeQueries.transactions.getById(transactionId);
        const isTransactionJarIncluded = jars.map(({ id }) => id).includes(transaction.jarId);
        if (!isTransactionJarIncluded) {
          const transactionJar = await financeQueriesDeps.jars.getById(transaction.jarId);
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
          ? await financeQueriesDeps.categories.listIncome()
          : await financeQueriesDeps.categories.listExpense();
      if (transactionId) {
        const transaction = await financeQueries.transactions.getById(transactionId);
        const isTransactionCategoryIncluded = categories
          .map(({ id }) => id)
          .includes(transaction.categoryId);
        if (kind === transaction.kind && !isTransactionCategoryIncluded) {
          const transactionCategory = await financeQueriesDeps.categories.getById(
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
