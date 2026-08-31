import { Input } from 'src/components/ui/input';
import { type TransferFormType } from 'src/hooks/useTransferForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { transferFormUtils } from 'src/lib/transferFormUtils';

export const TransferFormFieldDescription = ({ form }: { form: TransferFormType }) => (
  <form.Field name="description">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Description">
        <Input {...transferFormUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
