import { decimal } from 'src/lib/decimal';
import type { CurrencyAmount } from 'src/services/shared';

// Every amount is shown in English: a point for decimals and commas between thousands.
export const AMOUNT_LOCALE = 'en-US';

// `narrowSymbol` keeps the plain "$" sign: in English CLP would otherwise read "CLP 1,234".
export const clpNumberFormat = new Intl.NumberFormat(AMOUNT_LOCALE, {
  style: 'currency',
  currency: 'CLP',
  currencyDisplay: 'narrowSymbol',
});

const formatters = {
  USD: (amount: number) =>
    Intl.NumberFormat(AMOUNT_LOCALE, { style: 'currency', currency: 'USD' }).format(amount),
  CLP: (amount: number) => clpNumberFormat.format(amount),
};

export const formatCurrencyAmount = (value: CurrencyAmount) => {
  const amount = decimal.toNumber(value.amountDecimal);

  return formatters[value.currency](amount);
};
