import { useParams } from '@tanstack/react-router';
import { useTransaction } from './useTransaction';

export const useTransactionEditCurrentTransaction = () => {
  const { transactionId } = useParams({ strict: false });
  const transaction = useTransaction(transactionId ?? '');

  if (transactionId) {
    return transaction;
  }

  return undefined;
};
