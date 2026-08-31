import { Input } from 'src/components/ui/input';
import { type TransferFormType } from 'src/hooks/useTransferForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { transferFormUtils } from 'src/lib/transferFormUtils';

export const TransferFormFieldDate = ({ form }: { form: TransferFormType }) => (
  <form.Field name="date">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Date">
        <Input type="datetime-local" {...transferFormUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
