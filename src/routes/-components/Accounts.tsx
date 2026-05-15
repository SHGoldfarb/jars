import { Trash2 } from 'lucide-react';
import { Button } from 'components/ui/button';
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import { useAccounts } from 'src/hooks/useAccounts';
import { Link } from '@tanstack/react-router';

const AccountItem = ({ name }: { name: string }) => {
  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${name}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </ItemActions>
    </Item>
  );
};

export const Accounts = () => {
  const { accounts } = useAccounts();

  return (
    <ItemGroup className="p-6 max-w-lg mx-auto">
      <Item variant="outline">
        <ItemActions className="w-full">
          <Link to={'/accounts/new'} className="mx-auto">
            <Button variant="ghost" aria-label={`Create account`}>
              Add account
            </Button>
          </Link>
        </ItemActions>
      </Item>
      {accounts.map((account) => (
        <AccountItem key={account.id} name={account.name} />
      ))}
    </ItemGroup>
  );
};
