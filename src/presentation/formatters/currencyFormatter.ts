import type { CurrencyAmount, Decimal } from 'src/services/finance/model';

const decimalToNumber = (value: Decimal) => {
  return Number(value.value) / 10 ** value.decimalPlaces;
};

// Guards agains code drift in CurrencyAmount, ensuring that TypeScipt errors
// if called with a new currency that was added to CurrencyAmount but not to formatCurrencyAmount.
type supportedCurrencies = 'USD' | 'CLP';

export const formatCurrencyAmount = (value: CurrencyAmount & { currency: supportedCurrencies }) => {
  const amount = decimalToNumber(value.amountDecimal);

  if (value.currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }

  return `$${amount.toFixed(0)}`;
};
