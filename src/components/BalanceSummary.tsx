import { useId } from 'react';
import type { CurrencyAmount } from 'src/services/shared';
import { BalanceAmount } from './BalanceAmount';

// The headline figure of a list of balances: what they add up to.
export const BalanceSummary = ({
  label,
  total,
}: {
  label: string;
  total: CurrencyAmount | undefined;
}) => {
  const labelId = useId();

  return (
    <section aria-labelledby={labelId} className="mx-auto w-full max-w-lg px-4 pt-6">
      <h1 id={labelId} className="px-1 text-xs font-medium text-muted-foreground">
        {label}
      </h1>
      <p className="px-1 text-3xl tracking-tight">
        {total ? <BalanceAmount balance={total} className="font-semibold" /> : ' '}
      </p>
    </section>
  );
};
