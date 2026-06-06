import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldKind = ({ form }: { form: TransactionFormType }) => (
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
        />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
