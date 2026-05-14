import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from 'components/ui/button';
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from 'components/ui/item';
import type { Account } from 'src/services/finance';

const AccountItem = ({ account }: { account: Account }) => {
  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>{account.name}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${account.name}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </ItemActions>
    </Item>
  );
};

const MOCK_ACCOUNTS: Account[] = [
  { id: '1', name: 'Wallet' },
  { id: '2', name: 'Bank Account' },
  { id: '3', name: 'Savings' },
];

export const Accounts = () => {
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);

  return (
    <ItemGroup className="p-6 max-w-lg mx-auto">
      {accounts.map((account) => (
        <AccountItem key={account.id} account={account} />
      ))}
    </ItemGroup>
  );
};
