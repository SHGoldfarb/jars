import type { Decimal } from 'src/services/shared';

const toNumber = (decimal: Decimal) => {
  return Number(decimal.value) / 10 ** decimal.decimalPlaces;
};

export const decimal = {
  toNumber,
};
