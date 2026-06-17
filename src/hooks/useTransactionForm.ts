import { TransactionUnsaved } from 'src/services/finance';
import { transactionFormUtils, type TransactionFormValues } from 'src/lib/transactionFormUtils';
import { useTransactionFormValidate } from 'src/hooks/useTransactionFormValidate';
import { useForm } from '@tanstack/react-form';

export const useTransactionForm = ({
  onSubmit,
  defaultErrorMessage,
  defaultValues,
}: {
  onSubmit: (value: TransactionUnsaved) => Promise<void>;
  defaultErrorMessage: string;
  defaultValues?: TransactionFormValues;
}) => {
  const { validateWithSchema, transactionFormSchema } = useTransactionFormValidate();

  return useForm({
    defaultValues: defaultValues ?? transactionFormUtils.getDefaultValues(),
    validators: { onSubmit: ({ value }) => validateWithSchema(value) },
    onSubmit: async ({ value, formApi }) => {
      try {
        const parsedValues = transactionFormSchema.parse(value);

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

export type TransactionFormType = ReturnType<typeof useTransactionForm>;
