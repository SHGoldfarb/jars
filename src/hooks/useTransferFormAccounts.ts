import { useQuery } from '@tanstack/react-query';
import { transferForm } from 'src/services/transfer-form';

export const useTransferFormAccounts = (transferId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transferFormQueries.getAccountsForSelector', transferId],
    queryFn: () => transferForm.queries.getAccountsForSelector(transferId),
  });
  return data ?? [];
};
