import { Form } from 'src/components/Form';
import { useTransactionFormSpec } from 'src/hooks/useTransactionFormSpec';
import type { YearMonthKey } from 'src/lib/yearMonth';
import type { BookmarkUnsaved, TransactionUnsaved } from 'src/services/finance';
import { transactionForm, type TransactionFormValues } from 'src/services/transaction-form';

export const TransactionForm = ({
  title,
  onSubmit,
  cancelMonth,
  onDelete,
  onBookmark,
  defaultErrorMessage,
  defaultValues,
}: {
  title: string;
  onSubmit: (value: TransactionUnsaved) => Promise<void>;
  // Cancelling always goes back to Movements; this is the month it should land on.
  cancelMonth?: YearMonthKey;
  onDelete?: () => void;
  // Given, the form offers to save what is typed into it as a bookmark.
  onBookmark?: (bookmark: BookmarkUnsaved) => Promise<void>;
  defaultErrorMessage: string;
  defaultValues?: TransactionFormValues;
}) => {
  const { fields, schema, bookmarkSchema } = useTransactionFormSpec();

  return (
    <Form
      title={title}
      fields={fields}
      defaultValues={defaultValues ?? transactionForm.getDefaultValues()}
      schema={schema}
      onSubmit={(values) => onSubmit(transactionForm.toUnsaved(values))}
      defaultErrorMessage={defaultErrorMessage}
      cancel={{ to: '/movements', search: { month: cancelMonth } }}
      onDelete={onDelete}
      secondaryAction={
        onBookmark
          ? {
              label: 'Save as bookmark',
              doneLabel: 'Bookmarked',
              schema: bookmarkSchema,
              onAction: (values) => onBookmark(transactionForm.toBookmark(values)),
            }
          : undefined
      }
    />
  );
};
