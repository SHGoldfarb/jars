import { type TransferFormType } from 'src/hooks/useTransferForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { useTransferFormAccounts } from 'src/hooks/useTransferFormAccounts';

export const TransferFormFieldAccount = ({
  form,
  name,
  label,
  placeholder,
  defaultOpen,
}: {
  form: TransferFormType;
  name: 'originAccountId' | 'destinationAccountId';
  label: string;
  placeholder: string;
  defaultOpen?: boolean;
}) => {
  const accounts = useTransferFormAccounts(undefined);

  return (
    <form.Field name={name}>
      {(field) => (
        <TransactionFormFieldWrapper field={field} label={label}>
          <TransactionFormFieldSelect
            field={field}
            placeholder={placeholder}
            options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            defaultOpen={defaultOpen}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
