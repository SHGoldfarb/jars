import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { useStore } from '@tanstack/react-form';

export const TransactionFormFieldKind = ({ form }: { form: TransactionFormType }) => {
  const kind = useStore(form.store, (state) => state.values.kind);
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
            defaultOpen={!kind}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
