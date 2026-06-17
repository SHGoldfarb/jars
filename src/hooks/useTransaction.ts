import { financeQueries } from 'src/services/finance/application';
import { useQuery } from '@tanstack/react-query';

export const useTransaction = (transactionId: string) =>
  useQuery({
    queryKey: ['financeQueries.getTransactionById', transactionId],
    queryFn: () => financeQueries.getTransactionById(transactionId),
  }).data;
