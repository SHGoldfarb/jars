import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldKind = ({
  form,
  defaultOpen,
}: {
  form: TransactionFormType;
  defaultOpen?: boolean;
}) => {
  return (
    <form.Field name="kind">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Type">
          <TransactionFormFieldSelect
            field={field}
            placeholder="Select type"
            options={[
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
            onChange={() => {
              form.setFieldValue('categoryId', '');
            }}
            defaultOpen={defaultOpen}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
