import { Form } from 'src/components/Form';
import { useTransactionFormSpec } from 'src/hooks/useTransactionFormSpec';
import type { YearMonthKey } from 'src/lib/yearMonth';
import { TransactionUnsaved } from 'src/services/finance';
import { transactionForm, type TransactionFormValues } from 'src/services/transaction-form';

export const TransactionForm = ({
  title,
  onSubmit,
  cancelMonth,
  onDelete,
  defaultErrorMessage,
  defaultValues,
}: {
  title: string;
  onSubmit: (value: TransactionUnsaved) => Promise<void>;
  // Cancelling always goes back to Movements; this is the month it should land on.
  cancelMonth?: YearMonthKey;
  onDelete?: () => void;
  defaultErrorMessage: string;
  defaultValues?: TransactionFormValues;
}) => {
  const { fields, schema } = useTransactionFormSpec();

  return (
    <Form
      title={title}
      fields={fields}
      defaultValues={defaultValues ?? transactionForm.getDefaultValues()}
      schema={schema}
      onSubmit={(values) =>
        onSubmit({
          ...values,
          dateISO: values.date,
          description: values.description.trim(),
        })
      }
      defaultErrorMessage={defaultErrorMessage}
      cancel={{ to: '/movements', search: { month: cancelMonth } }}
      onDelete={onDelete}
    />
  );
};
