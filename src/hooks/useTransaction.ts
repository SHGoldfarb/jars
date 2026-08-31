import { financeQueries } from 'src/services/finance';
import { useQuery } from '@tanstack/react-query';

export const useTransaction = (transactionId: string) =>
  useQuery({
    queryKey: ['financeQueries.getTransactionById', transactionId],
    queryFn: () => financeQueries.transactions.getById(transactionId),
  }).data;
