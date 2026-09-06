import { allocationFormQueries } from './application/queries';
import { allocationFormValues } from './application/formValues';
import { allocationFormSchema } from './domain/formSchema';

export const allocationForm = {
  queries: allocationFormQueries,
  getDefaultValues: allocationFormSchema.getDefaultValues,
  createFormSchema: allocationFormSchema.createFormSchema,
  toFormValues: allocationFormValues.toFormValues,
};

export type { AllocationFormValues } from './domain/formSchema';
