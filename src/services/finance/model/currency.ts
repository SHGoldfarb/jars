import * as z from 'zod';
import { Decimal, decimal } from './decimal';

export const CurrencyAmount = z.object({
  currency: z.enum(['CLP', 'USD']),
  amountDecimal: Decimal,
});

export type CurrencyAmount = z.infer<typeof CurrencyAmount>;

const sumCurrencyAmounts = (x: CurrencyAmount, y: CurrencyAmount): CurrencyAmount => {
  if (x.currency !== y.currency) {
    throw new Error('Cant sum different currencies');
  }

  return { amountDecimal: decimal.sum(x.amountDecimal, y.amountDecimal), currency: x.currency };
};

const negateCurrencyAmount = (amount: CurrencyAmount): CurrencyAmount => ({
  currency: amount.currency,
  amountDecimal: decimal.negate(amount.amountDecimal),
});

const toCurrency = (
  value: number,
  currency: CurrencyAmount['currency'] = 'CLP'
): CurrencyAmount => ({
  currency,
  amountDecimal: decimal.parseString(value.toString()),
});

export const currency = {
  sum: sumCurrencyAmounts,
  negate: negateCurrencyAmount,
  new: toCurrency,
};
