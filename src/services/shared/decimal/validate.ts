import type { Decimal } from './types'

const isInteger = (value: number) => Number.isInteger(value)

export const validateDecimal = (decimal: Decimal) => {
  if (!isInteger(decimal.decimalPlaces)) {
    throw new Error('Decimal places must be an integer')
  }
}

