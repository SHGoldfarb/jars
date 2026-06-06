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
  const validateTransactionForm = useTransactionFormValidate();

  return useForm({
    defaultValues: transactionFormUtils.getDefaultValues(),
    validators: { onSubmit: ({ value }) => validateTransactionForm(value) },
    onSubmit: async ({ value, formApi }) => {
      try {
        const amount = transactionFormUtils.parsePositiveAmountToClp(value.amount);
        const dateISO = transactionFormUtils.parseDateInputToISO(value.date);

        await onSubmit({
          ...value,
          amount,
          dateISO,
          description: value.description.trim(),
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
