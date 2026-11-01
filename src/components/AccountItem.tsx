import { ItemContent, ItemTitle } from 'components/ui/item';
import { useAccountBalance } from 'src/hooks/useAccountBalance';
import { BalanceAmount } from './BalanceAmount';

export const AccountItem = ({ account }: { account: { id: string; name: string } }) => {
  const balance = useAccountBalance(account.id);

  if (!balance) return null;

  return (
    <>
      <ItemContent>
        <ItemTitle className="text-sm">{account.name}</ItemTitle>
      </ItemContent>
      <ItemContent>
        <BalanceAmount balance={balance} className="text-sm" />
      </ItemContent>
    </>
  );
};
