import { transferForm } from 'src/services/transfer-form';
import { formUtils } from 'src/lib/formUtils';
import { useTransferFormAccounts } from './useTransferFormAccounts';
import { useTransferEditCurrentTransfer } from './useTransferEditCurrentTransfer';

export const useTransferFormValidate = () => {
  const transfer = useTransferEditCurrentTransfer();
  const accounts = useTransferFormAccounts(transfer?.id);

  const accountIds = accounts.map((account) => account.id);

  const transferFormSchema = transferForm.createFormSchema(accountIds);

  return {
    validateWithSchema: (value: Parameters<typeof formUtils.validateWithSchema>[0]) =>
      formUtils.validateWithSchema(value, transferFormSchema),
    transferFormSchema,
  };
};
