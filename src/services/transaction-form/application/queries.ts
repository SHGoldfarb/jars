import { byName, financeQueries, type Subcategory } from 'src/services/finance';

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
          return [transactionAccount, ...accounts].sort(byName);
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
          return [transactionJar, ...jars].sort(byName);
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
          return [transactionCategory, ...categories].sort(byName);
        }
      }
      return categories;
    },

    // Gets the options the transaction form subcategories selector offers, grouped by the
    // category they belong to. Grouped rather than fetched per category because which category
    // is selected lives in the form itself, and because the schema has to validate against
    // every group anyway - the same reason both kinds of category are fetched up front.
    // A transaction being edited keeps the subcategory it already carries, even if it or its
    // category has since been archived.
    getSubcategoriesByCategoryForSelector: async (transactionId: string | undefined) => {
      const subcategories = await financeQueriesDeps.subcategories.list();
      const editedSubcategoryId = transactionId
        ? (await financeQueries.transactions.getById(transactionId)).subcategoryId
        : undefined;

      const all =
        editedSubcategoryId && !subcategories.some(({ id }) => id === editedSubcategoryId)
          ? [await financeQueriesDeps.subcategories.getById(editedSubcategoryId), ...subcategories]
          : subcategories;

      const byCategory: Record<string, Subcategory[]> = {};
      for (const subcategory of all) {
        byCategory[subcategory.categoryId] = [
          ...(byCategory[subcategory.categoryId] ?? []),
          subcategory,
        ];
      }

      for (const group of Object.values(byCategory)) {
        group.sort(byName);
      }

      return byCategory;
    },
  };
};

export const transactionFormQueries = createTransactionFormQueries(financeQueries);
