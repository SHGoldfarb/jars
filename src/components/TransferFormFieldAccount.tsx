import { useStore } from '@tanstack/react-form';
import { type TransferFormType } from 'src/hooks/useTransferForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { useTransferFormAccounts } from 'src/hooks/useTransferFormAccounts';
import { useTransferEditCurrentTransfer } from 'src/hooks/useTransferEditCurrentTransfer';

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
  const transferBeingEdited = useTransferEditCurrentTransfer();
  const accounts = useTransferFormAccounts(transferBeingEdited?.id);
  const otherName = name === 'originAccountId' ? 'destinationAccountId' : 'originAccountId';
  const otherAccountId = useStore(form.store, (state) => state.values[otherName]);

  return (
    <form.Field name={name}>
      {(field) => (
        <TransactionFormFieldWrapper field={field} label={label}>
          <TransactionFormFieldSelect
            field={field}
            placeholder={placeholder}
            options={accounts
              .filter((account) => account.id !== otherAccountId)
              .map((account) => ({ value: account.id, label: account.name }))}
            defaultOpen={defaultOpen}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
