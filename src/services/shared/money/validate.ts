import type { CurrencyAmount } from './types';
import { validateDecimal } from '../decimal';

export const validateCurrencyAmount = (currencyAmount: CurrencyAmount) => {
  validateDecimal(currencyAmount.amountDecimal);
};
