import { ItemContent, ItemTitle } from 'components/ui/item';
import { useJarBalance } from 'src/hooks/useJarBalance';
import { decimal } from 'src/lib/decimal';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';

export const JarItem = ({ jar }: { jar: { id: string; name: string } }) => {
  const balance = useJarBalance(jar.id);

  if (!balance) return null;

  return (
    <>
      <ItemContent>
        <ItemTitle>{jar.name}</ItemTitle>
      </ItemContent>
      <ItemContent>
        <ItemTitle
          className={
            decimal.toNumber(balance.amountDecimal) > 0 ? 'text-emerald-400' : 'text-rose-400'
          }
        >
          {formatCurrencyAmount(balance)}
        </ItemTitle>
      </ItemContent>
    </>
  );
};
