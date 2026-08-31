import { ItemContent, ItemTitle } from 'components/ui/item';
import { useAccountBalance } from 'src/hooks/useAccountBalance';
import { decimal } from 'src/lib/decimal';
import { formatCurrencyAmount } from 'src/presentation/formatters/currencyFormatter';

export const AccountItem = ({ account }: { account: { id: string; name: string } }) => {
  const balance = useAccountBalance(account.id);

  if (!balance) return null;

  return (
    <>
      <ItemContent>
        <ItemTitle>{account.name}</ItemTitle>
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
