import { decimal, type CurrencyAmount } from 'src/services/finance';

// Guards agains code drift in CurrencyAmount, ensuring that TypeScipt errors
// if called with a new currency that was added to CurrencyAmount but not to formatCurrencyAmount.
type supportedCurrencies = 'USD' | 'CLP';

export const formatCurrencyAmount = (value: CurrencyAmount & { currency: supportedCurrencies }) => {
  const amount = decimal.toNumber(value.amountDecimal);

  if (value.currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }

  return `$${amount.toFixed(0)}`;
};
