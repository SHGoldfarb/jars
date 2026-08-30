import { TransferUnsaved } from 'src/services/finance';
import { transferFormUtils, type TransferFormValues } from 'src/lib/transferFormUtils';
import { useTransferFormValidate } from 'src/hooks/useTransferFormValidate';
import { useForm } from '@tanstack/react-form';

export const useTransferForm = ({
  onSubmit,
  defaultErrorMessage,
  defaultValues,
}: {
  onSubmit: (value: TransferUnsaved) => Promise<void>;
  defaultErrorMessage: string;
  defaultValues?: TransferFormValues;
}) => {
  const { validateWithSchema, transferFormSchema } = useTransferFormValidate();

  return useForm({
    defaultValues: defaultValues ?? transferFormUtils.getDefaultValues(),
    validators: { onSubmit: ({ value }) => validateWithSchema(value) },
    onSubmit: async ({ value, formApi }) => {
      try {
        const parsedValues = transferFormSchema.parse(value);

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

export type TransferFormType = ReturnType<typeof useTransferForm>;
