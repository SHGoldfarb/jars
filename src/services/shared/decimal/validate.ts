import type { Decimal } from './types'

const isInteger = (value: number) => Number.isInteger(value)

export const validateDecimal = (decimal: Decimal) => {
  if (typeof decimal.value !== 'bigint') {
    throw new Error('Decimal value must be a bigint')
  }

  if (!isInteger(decimal.decimalPlaces)) {
    throw new Error('Decimal places must be an integer')
  }
}

