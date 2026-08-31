import { transactionFormCommands } from './application/commands';
import { transactionFormQueries } from './application/queries';
import { transactionFormValues } from './application/formValues';
import { transactionFormSchema } from './domain/formSchema';

export const transactionForm = {
  commands: transactionFormCommands,
  queries: transactionFormQueries,
  getDefaultValues: transactionFormSchema.getDefaultValues,
  createFormSchema: transactionFormSchema.createFormSchema,
  toFormValues: transactionFormValues.toFormValues,
};

export type { TransactionFormValues } from './domain/formSchema';
