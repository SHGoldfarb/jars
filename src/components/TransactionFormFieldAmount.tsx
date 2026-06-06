import { Input } from 'src/components/ui/input';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { transactionFormUtils } from 'src/lib/transactionFormUtils';

export const TransactionFormFieldAmount = ({ form }: { form: TransactionFormType }) => {
  return (
    <form.Field name="amount">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Amount">
          <Input
            // eslint-disable-next-line jsx-a11y/no-autofocus -- user navigates here manually -> autofocus is fine
            autoFocus
            inputMode="decimal"
            placeholder="10000"
            {...transactionFormUtils.inputProps(field)}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
