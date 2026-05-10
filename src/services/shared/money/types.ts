import type { Decimal } from '../decimal';

export type Currency = 'CLP' | 'USD';

export interface CurrencyAmount {
  currency: Currency;
  amountDecimal: Decimal;
}
