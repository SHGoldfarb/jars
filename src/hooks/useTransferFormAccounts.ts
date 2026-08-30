import { useQuery } from '@tanstack/react-query';
import { transferFormQueries } from 'src/services/transfer-form/application/queries';

export const useTransferFormAccounts = (transferId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ['transferFormQueries.getAccountsForSelector', transferId],
    queryFn: () => transferFormQueries.getAccountsForSelector(transferId),
  });
  return data ?? [];
};
