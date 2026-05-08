import type { CurrencyAmount } from './types'
import { decimals } from '../decimal'

const sumCurrencyAmounts = (x: CurrencyAmount, y: CurrencyAmount): CurrencyAmount => {
  if (x.currency !== y.currency) {
    throw new Error('Cant sum different currencies')
  }

  return { amountDecimal: decimals.sum(x.amountDecimal, y.amountDecimal), currency: x.currency }
}

const negateCurrencyAmount = (amount: CurrencyAmount): CurrencyAmount => ({
  currency: amount.currency,
  amountDecimal: decimals.negate(amount.amountDecimal),
})

export const currencies = {
  sum: sumCurrencyAmounts,
  negate: negateCurrencyAmount
}