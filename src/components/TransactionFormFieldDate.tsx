import { Input } from 'src/components/ui/input';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { transactionFormUtils } from 'src/lib/transactionFormUtils';

export const TransactionFormFieldDate = ({ form }: { form: TransactionFormType }) => (
  <form.Field name="date">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Date">
        <Input type="datetime-local" {...transactionFormUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
