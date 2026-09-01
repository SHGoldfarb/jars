import { useParams } from '@tanstack/react-router';
import { useTransfer } from './useTransfer';

export const useTransferEditCurrentTransfer = () => {
  const { transferId } = useParams({ strict: false });
  const transfer = useTransfer(transferId ?? '');

  if (transferId) {
    return transfer;
  }

  return undefined;
};
