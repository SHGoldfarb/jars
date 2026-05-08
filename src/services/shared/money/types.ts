import type { Decimal } from '../decimal'

export type Currency = 'CLP' | 'USD'

export type CurrencyAmount = {
  currency: Currency
  amountDecimal: Decimal
}

