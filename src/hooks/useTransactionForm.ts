import { TransactionUnsaved } from 'src/services/finance';
import { transactionFormUtils } from 'src/lib/transactionFormUtils';
import { useTransactionFormValidate } from 'src/hooks/useTransactionFormValidate';
import { useForm } from '@tanstack/react-form';

export const useTransactionForm = ({
  onSubmit,
  defaultErrorMessage,
}: {
  onSubmit: (value: TransactionUnsaved) => Promise<void>;
  defaultErrorMessage: string;
}) => {
  const { validateWithSchema, transactionFormSchema } = useTransactionFormValidate();

  return useForm({
    defaultValues: transactionFormUtils.getDefaultValues(),
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
