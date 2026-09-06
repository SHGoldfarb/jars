import { allocationFormQueries } from './application/queries';
import { allocationFormSchema } from './domain/formSchema';

export const allocationForm = {
  queries: allocationFormQueries,
  getDefaultValues: allocationFormSchema.getDefaultValues,
  createFormSchema: allocationFormSchema.createFormSchema,
};

export type { AllocationFormValues } from './domain/formSchema';
