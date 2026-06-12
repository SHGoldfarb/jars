import { decimal, type CurrencyAmount } from 'src/services/finance';

const formatters = {
  USD: (amount: number) =>
    Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount),
  CLP: (amount: number) =>
    Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount),
};

export const formatCurrencyAmount = (value: CurrencyAmount) => {
  const amount = decimal.toNumber(value.amountDecimal);

  return formatters[value.currency](amount);
};
