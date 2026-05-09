import type { Transfer, Allocation, Transaction } from '../model';
import { validateCurrencyAmount } from '../../shared';

export const validateTransaction = (transaction: Transaction) => {
  validateCurrencyAmount(transaction.amount);
  if (!(transaction.amount.amountDecimal.value > 0n)) {
    throw new Error('Transaction amount should be positive');
  }
};

export const validateTransfer = (transfer: Transfer) => {
  validateCurrencyAmount(transfer.amount);
  if (!(transfer.amount.amountDecimal.value > 0n)) {
    throw new Error('Transaction amount should be positive');
  }
};

export const validateAllocation = (allocation: Allocation) => {
  validateCurrencyAmount(allocation.amount);
  if (!(allocation.amount.amountDecimal.value > 0n)) {
    throw new Error('Transaction amount should be positive');
  }
};

export const validateApplicationState = (
  allocations: Allocation[],
  transfers: Transfer[],
  transactions: Transaction[]
) => {
  allocations.forEach(validateAllocation);
  transfers.forEach(validateTransfer);
  transactions.forEach(validateTransaction);
};
