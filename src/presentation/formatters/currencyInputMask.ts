import type { FormFieldMask } from 'src/lib/formSpec';
import { AMOUNT_LOCALE, clpNumberFormat } from 'src/presentation/formatters/currencyFormatter';

// An amount input shows its value the way amounts are shown everywhere else - "$1,234,567" - while
// the form keeps the plain decimal string ("1234567", "1234.5") that `currencyInput` parses.
const decimalSeparator =
  new Intl.NumberFormat(AMOUNT_LOCALE).formatToParts(1.1).find(({ type }) => type === 'decimal')
    ?.value ?? '.';

// A trailing point with nothing after it yet ("12.") is what the user has typed so far, so it is
// shown rather than dropped, or the decimal separator could never be typed.
const plainDecimalRegex = /^\d+(\.\d*)?$/;

// A BigInt keeps every digit exact, however long the amount.
const formatWhole = (digits: string) => clpNumberFormat.format(BigInt(digits));

const format = (value: string): string => {
  if (!plainDecimalRegex.test(value)) {
    // Not an amount the mask produced - shown as it is rather than hidden behind a guess.
    return value;
  }

  const point = value.indexOf('.');
  if (point === -1) {
    return formatWhole(value);
  }

  return `${formatWhole(value.slice(0, point))}${decimalSeparator}${value.slice(point + 1)}`;
};

// Only digits and the first decimal separator count: the currency symbol and group separators
// are the mask's own, and anything else typed is dropped.
const parse = (input: string): string => {
  const [whole, ...fractions] = input.split(decimalSeparator);
  const wholeDigits = whole.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

  if (fractions.length === 0) {
    return wholeDigits;
  }

  return `${wholeDigits || '0'}.${fractions.join('').replace(/\D/g, '')}`;
};

export const clpInputMask: FormFieldMask = { format, parse };
