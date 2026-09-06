import { allocationForm } from 'src/services/allocation-form';
import { formUtils } from 'src/lib/formUtils';
import { useAllocationFormJars } from './useAllocationFormJars';
import { useAllocationEditCurrentAllocation } from './useAllocationEditCurrentAllocation';

export const useAllocationFormValidate = () => {
  const allocation = useAllocationEditCurrentAllocation();
  const jars = useAllocationFormJars(allocation?.id);

  const jarIds = jars.map((jar) => jar.id);

  const allocationFormSchema = allocationForm.createFormSchema(jarIds);

  return {
    validateWithSchema: (value: Parameters<typeof formUtils.validateWithSchema>[0]) =>
      formUtils.validateWithSchema(value, allocationFormSchema),
    allocationFormSchema,
  };
};
