import { decimal } from 'src/lib/decimal';
import { cn } from 'src/lib/utils';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';
import type { CurrencyAmount } from 'src/services/shared';

// A balance only calls attention to itself when it is overdrawn: a positive one reads as
// normal text, an empty one fades back, and only a negative one turns red.
const toneClassName = (balance: CurrencyAmount) => {
  if (decimal.isZero(balance.amountDecimal)) {
    return 'text-muted-foreground';
  }
  return decimal.toNumber(balance.amountDecimal) < 0 ? 'text-rose-600 dark:text-rose-400' : '';
};

export const BalanceAmount = ({
  balance,
  className,
}: {
  balance: CurrencyAmount;
  className?: string;
}) => (
  <span className={cn('font-medium tabular-nums', toneClassName(balance), className)}>
    {formatCurrencyAmount(balance)}
  </span>
);
