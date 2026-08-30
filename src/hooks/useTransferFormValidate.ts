import { transferFormUtils } from 'src/lib/transferFormUtils';
import { formUtils } from 'src/lib/formUtils';
import { useTransferFormAccounts } from './useTransferFormAccounts';

export const useTransferFormValidate = () => {
  const accounts = useTransferFormAccounts(undefined);

  const accountIds = accounts.map((account) => account.id);

  const transferFormSchema = transferFormUtils.createFormSchema(accountIds);

  return {
    validateWithSchema: (value: Parameters<typeof formUtils.validateWithSchema>[0]) =>
      formUtils.validateWithSchema(value, transferFormSchema),
    transferFormSchema,
  };
};
