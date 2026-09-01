import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useTransfer = (transferId: string) =>
  useQuery({
    queryKey: ['financeQueries.getTransferById', transferId],
    queryFn: () => financeQueries.transfers.getById(transferId),
  }).data;
