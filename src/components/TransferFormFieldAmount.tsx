import { Input } from 'src/components/ui/input';
import { type TransferFormType } from 'src/hooks/useTransferForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { transferFormUtils } from 'src/lib/transferFormUtils';

export const TransferFormFieldAmount = ({ form }: { form: TransferFormType }) => (
  <form.Field name="amount">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Amount">
        <Input inputMode="decimal" placeholder="10000" {...transferFormUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
