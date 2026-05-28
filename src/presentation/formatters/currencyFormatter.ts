import { decimal, type CurrencyAmount } from 'src/services/finance';

// Even if CurrencyAmount already restricts this, that can change in the future
// so we re-define the supported currencies here
type supportedCurrencies = 'USD' | 'CLP';

export const formatCurrencyAmount = (value: CurrencyAmount & { currency: supportedCurrencies }) => {
  const amount = decimal.toNumber(value.amountDecimal);

  if (value.currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }

  return `$${amount.toFixed(0)}`;
};
