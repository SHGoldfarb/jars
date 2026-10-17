import { transactionFormCommands } from './application/commands';
import { transactionFormQueries } from './application/queries';
import { transactionFormValues } from './application/formValues';
import { transactionFormSchema } from './domain/formSchema';

export const transactionForm = {
  commands: transactionFormCommands,
  queries: transactionFormQueries,
  getDefaultValues: transactionFormSchema.getDefaultValues,
  createFormSchema: transactionFormSchema.createFormSchema,
  createBookmarkSchema: transactionFormSchema.createBookmarkSchema,
  toFormValues: transactionFormValues.toFormValues,
  toUnsaved: transactionFormValues.toUnsaved,
  toBookmark: transactionFormValues.toBookmark,
};

export type {
  ParsedTransactionBookmarkValues,
  ParsedTransactionFormValues,
  TransactionFormOptions,
  TransactionFormValues,
} from './domain/formSchema';
