import type { CurrencyAmount } from '../model';
import { decimal } from './decimal';

// Guard against future additions to the Currency enum: TypeScript compile will fail
type SupportedCurrencyTypes = 'CLP' | 'USD';

const stringify = (value: CurrencyAmount & { currency: SupportedCurrencyTypes }) => {
  const amount = decimal.toNumber(value.amountDecimal);

  if (value.currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }

  return `$${amount.toFixed(0)}`;
};

export const currency = {
  stringify,
};
