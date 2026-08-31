import { Input } from 'src/components/ui/input';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';

export const TransactionFormFieldDate = ({ form }: { form: TransactionFormType }) => (
  <form.Field name="date">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Date">
        <Input type="datetime-local" {...formUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
