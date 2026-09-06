import { allocationForm } from 'src/services/allocation-form';
import { formUtils } from 'src/lib/formUtils';
import { useAllocationFormJars } from './useAllocationFormJars';

export const useAllocationFormValidate = () => {
  // slice 2 threads the allocation being edited through here
  const jars = useAllocationFormJars(undefined);

  const jarIds = jars.map((jar) => jar.id);

  const allocationFormSchema = allocationForm.createFormSchema(jarIds);

  return {
    validateWithSchema: (value: Parameters<typeof formUtils.validateWithSchema>[0]) =>
      formUtils.validateWithSchema(value, allocationFormSchema),
    allocationFormSchema,
  };
};
