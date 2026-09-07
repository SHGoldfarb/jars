import { transferFormCommands } from './application/commands';
import { transferFormQueries } from './application/queries';
import { transferFormValues } from './application/formValues';
import { transferFormSchema } from './domain/formSchema';

export const transferForm = {
  commands: transferFormCommands,
  queries: transferFormQueries,
  getDefaultValues: transferFormSchema.getDefaultValues,
  createFormSchema: transferFormSchema.createFormSchema,
  toFormValues: transferFormValues.toFormValues,
};

export type { TransferFormValues } from './domain/formSchema';
