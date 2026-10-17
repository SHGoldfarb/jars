import { byName, financeQueries, type Subcategory } from 'src/services/finance';
import type { TransactionFormValues } from '../domain/formSchema';
import { transactionFormValues } from './formValues';

const createTransactionFormQueries = (financeQueriesDeps: typeof financeQueries) => {
  const queries = {
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

  // Gets the values a new transaction started from a bookmark opens with: the bookmark's own,
  // the date left at the form's default. A reference the selectors would no longer offer - a
  // deleted account, jar, category or subcategory - is left empty for the user to pick again,
  // since the form only accepts what its selectors offer. A bookmark that is gone, or is not a
  // transaction's (a hand-edited link), gives nothing, and the form opens blank.
  const getFormValuesFromBookmark = async (
    bookmarkId: string
  ): Promise<TransactionFormValues | undefined> => {
    const bookmark = (await financeQueriesDeps.bookmarks.list()).find(
      ({ id }) => id === bookmarkId
    );
    if (bookmark?.movementType !== 'transaction') {
      return undefined;
    }

    const [accounts, jars, categories, subcategoriesByCategoryId] = await Promise.all([
      queries.getAccountsForSelector(undefined),
      queries.getJarsForSelector(undefined),
      queries.getCategoriesForSelector(bookmark.kind, undefined),
      queries.getSubcategoriesByCategoryForSelector(undefined),
    ]);
    const offered = (options: { id: string }[], id: string) =>
      options.some((option) => option.id === id) ? id : '';

    const values = transactionFormValues.fromBookmark(bookmark);
    const categoryId = offered(categories, values.categoryId);
    return {
      ...values,
      accountId: offered(accounts, values.accountId),
      jarId: offered(jars, values.jarId),
      categoryId,
      // Only ever one of the kept category's own: with the category gone, so is the choice.
      subcategoryId: offered(subcategoriesByCategoryId[categoryId] ?? [], values.subcategoryId),
    };
  };

  return { ...queries, getFormValuesFromBookmark };
};

export const transactionFormQueries = createTransactionFormQueries(financeQueries);
