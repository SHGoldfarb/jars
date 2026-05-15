import { Item, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import { useAccounts } from 'src/hooks/useAccounts';
import { Link } from '@tanstack/react-router';

const AccountItem = ({ name, id }: { name: string; id: string }) => {
  return (
    <Link to={`/accounts/$accountId/edit`} params={{ accountId: id }}>
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>{name}</ItemTitle>
        </ItemContent>
      </Item>
    </Link>
  );
};

export const Accounts = () => {
  const { accounts } = useAccounts();
  return (
    <ItemGroup className="p-6 max-w-lg mx-auto">
      <Link to={'/accounts/new'}>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle className="mx-auto font-bold">Add account</ItemTitle>
          </ItemContent>
        </Item>
      </Link>
      {accounts.map((account) => (
        <AccountItem key={account.id} name={account.name} id={account.id} />
      ))}
    </ItemGroup>
  );
};
