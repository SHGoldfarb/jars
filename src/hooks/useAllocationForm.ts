import { AllocationUnsaved } from 'src/services/finance';
import { allocationForm, type AllocationFormValues } from 'src/services/allocation-form';
import { useAllocationFormValidate } from 'src/hooks/useAllocationFormValidate';
import { useForm } from '@tanstack/react-form';

export const useAllocationForm = ({
  onSubmit,
  defaultErrorMessage,
  defaultValues,
}: {
  onSubmit: (value: AllocationUnsaved) => Promise<void>;
  defaultErrorMessage: string;
  defaultValues?: AllocationFormValues;
}) => {
  const { validateWithSchema, allocationFormSchema } = useAllocationFormValidate();

  return useForm({
    defaultValues: defaultValues ?? allocationForm.getDefaultValues(),
    validators: { onSubmit: ({ value }) => validateWithSchema(value) },
    onSubmit: async ({ value, formApi }) => {
      try {
        const parsedValues = allocationFormSchema.parse(value);

        await onSubmit({
          ...parsedValues,
          dateISO: parsedValues.date,
          description: parsedValues.description.trim(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : defaultErrorMessage;
        formApi.setErrorMap({
          ...formApi.state.errorMap,
          onSubmit: { form: message, fields: {} },
        });
      }
    },
  });
};

export type AllocationFormType = ReturnType<typeof useAllocationForm>;
