import type { Decimal, CurrencyAmount, Transfer, Allocation, Transaction } from './entities'

const isInteger = (value: number) => Number.isInteger(value)

const isPositive = (currencyAmount: CurrencyAmount) => currencyAmount.amountDecimal.value > 0n

export const validateDecimal = (decimal: Decimal) => {
  if (typeof decimal.value !== 'bigint') {
    throw new Error('Decimal value must be a bigint')
  }

  if (!isInteger(decimal.decimalPlaces)) {
    throw new Error('Decimal places must be an integer')
  }
}

export const validateCurrencyAmount = (currencyAmount: CurrencyAmount) => {
  validateDecimal(currencyAmount.amountDecimal)
}

export const validateTransaction = (transaction: Transaction) => {
  validateCurrencyAmount(transaction.amount)
  if (!isPositive(transaction.amount)) {
    throw new Error('Transaction amount should be positive')
  }
}

export const validateTransfer = (transfer: Transfer) => {
  validateCurrencyAmount(transfer.amount)
  if (!isPositive(transfer.amount)) {
    throw new Error('Transaction amount should be positive')
  }
}

export const validateAllocation = (allocation: Allocation) => {
  validateCurrencyAmount(allocation.amount)
  if (!isPositive(allocation.amount)) {
    throw new Error('Transaction amount should be positive')
  }
}

export const validateApplicationState = (allocations: Allocation[], transfers: Transfer[], transactions: Transaction[]) => {
  allocations.forEach(validateAllocation)
  transfers.forEach(validateTransfer)
  transactions.forEach(validateTransaction)
}